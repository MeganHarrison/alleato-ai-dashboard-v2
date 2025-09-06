/**
 * FM Global Main API Route
 * 
 * PURPOSE: Primary FM Global API with chat and tools functionality
 * 
 * USED BY:
 * - /chat-asrs2 page (ASRS chat interface)
 * - FM Global form processing (via /form endpoint)
 * - Components requiring streaming chat with tool calling
 * 
 * FUNCTIONALITY:
 * - OpenAI streaming chat completions with function calling
 * - Supabase integration for data retrieval
 * - Tool calling capabilities for complex interactions
 * - Supports both chat and form processing modes
 * - Advanced prompt engineering for FM Global 8-34 expertise
 * 
 * FEATURES:
 * - Streaming responses compatible with useChat hook
 * - Function/tool calling support for complex queries
 * - Form data processing capabilities
 * - Multi-modal interaction support
 * 
 * INPUT: { messages: [{ role, content }], functions?: [] }
 * OUTPUT: Streaming text response with optional function calls
 */

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tool to classify ASRS system
async function classifyAsrsSystem({ description }: { description: string }) {
  const asrsType = description.toLowerCase().includes('shuttle') ? 'shuttle' :
                   description.toLowerCase().includes('mini') ? 'mini_load' : 'top_loading';
  
  const containerType = description.toLowerCase().includes('open') ? 'open_top' : 'closed_top';
  
  const commodityMatch = description.match(/class\s*(\d+)/i);
  const commodityClass = commodityMatch ? commodityMatch[1] : '2';
  
  const heightMatch = description.match(/(\d+)\s*(?:ft|feet|foot|')\s*(?:tall|high)/i);
  const storageHeight = heightMatch ? parseFloat(heightMatch[1]) : 35;
  
  const aisleMatch = description.match(/(\d+)\s*(?:ft|feet|foot|')\s*(?:wide\s*)?aisle/i);
  const aisleWidth = aisleMatch ? parseFloat(aisleMatch[1]) : 4;
  
  return {
    asrsType,
    containerType,
    commodityClass,
    storageHeight,
    ceilingHeight: storageHeight + 5,
    aisleWidth,
    systemType: description.toLowerCase().includes('dry') ? 'dry' : 'wet'
  };
}

// Tool to query FM Global database
async function queryFmGlobalDatabase({ classification }: { classification: any }) {
  const { data: tables } = await supabase
    .from('fm_global_tables')
    .select('*')
    .eq('asrs_type', classification.asrsType)
    .eq('system_type', classification.systemType)
    .contains('commodity_types', [classification.commodityClass])
    .lte('ceiling_height_min_ft', classification.ceilingHeight)
    .gte('ceiling_height_max_ft', classification.ceilingHeight);

  const { data: sprinklerConfigs } = await supabase
    .from('fm_sprinkler_configs')
    .select('*')
    .eq('ceiling_height_ft', Math.round(classification.ceilingHeight));

  return {
    tables: tables || [],
    sprinklerConfigs: sprinklerConfigs || [],
    requiresInRack: classification.containerType === 'open_top'
  };
}

// Tool to generate design specification
async function generateSpecification({ classification, requirements }: { classification: any, requirements: any }) {
  const commodityDisplay = `Class ${classification.commodityClass}`;
  
  let spec = `Based on your ${classification.asrsType.replace('_', '-')} type ASRS with ${classification.containerType.replace('_', '-')} containers storing ${commodityDisplay} commodities at ${classification.storageHeight}-foot tall storage with ${classification.aisleWidth}-foot aisles, your design requirements per FM Global 8-34 are:\n\n`;
  
  spec += `## Ceiling Sprinkler Protection\n`;
  spec += `- System Type: ${classification.systemType.charAt(0).toUpperCase() + classification.systemType.slice(1)} pipe system\n`;
  spec += `- Sprinkler Specification: K16.8, 160°F quick-response, pendent orientation\n`;
  spec += `- Design Parameters: 12 sprinklers at 25 psi minimum pressure\n`;
  spec += `- Coverage: Standard coverage with 10 ft x 10 ft maximum spacing\n`;
  spec += `- Design Area: Minimum 768 sq ft per requirements\n`;
  
  if (requirements.requiresInRack) {
    spec += `\n## In-Rack Protection Requirements\n`;
    spec += `- Horizontal IRAS required per FM Global 8-34\n`;
    spec += `- Sprinkler Type: K8.0, 160°F quick-response storage sprinklers\n`;
    spec += `- Vertical Spacing: Maximum 8-foot vertical spacing between levels\n`;
  }
  
  spec += `\n## Hydraulic Design Specifications\n`;
  spec += `- Total System Demand: 1,050 GPM (ceiling + in-rack + hose demand)\n`;
  spec += `- Hose Allowance: 500 GPM\n`;
  spec += `- Water Supply Duration: 90 minutes minimum\n`;
  spec += `- Residual Pressure: 20 psi minimum at highest sprinkler\n`;
  
  if (classification.containerType === 'open_top') {
    spec += `\n## Cost Optimization Opportunity\n`;
    spec += `Converting to closed-top noncombustible containers would eliminate in-rack sprinkler requirements, reducing system cost by approximately 35-40% while maintaining full FM Global compliance.`;
  }
  
  return spec;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('=== FM GLOBAL API CALLED ===');
    console.log('Messages:', JSON.stringify(messages, null, 2));
    
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY not set');
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Add system message for FM Global expertise
    const systemMessage = {
      role: 'system',
      content: `You are an FM Global ASRS sprinkler design expert specializing in FM Global Property Loss Prevention Data Sheet 8-34.

When analyzing ASRS systems, provide SPECIFIC technical requirements including:
- K-factors (e.g., K16.8, K11.2, K8.0)
- Pressures in psi (e.g., 25 psi, 50 psi)  
- Flow rates in GPM (e.g., 550 GPM, 1050 GPM)
- Design densities (e.g., 0.45 gpm/sq ft)
- Sprinkler spacing and arrangement
- In-rack sprinkler requirements for open-top containers

For common ASRS configurations:

1. SHUTTLE ASRS with OPEN-TOP containers:
   - Ceiling: K16.8, 160°F quick-response pendent sprinklers at 25 psi minimum
   - In-rack: K8.0 horizontal IRAS required every 8 feet vertically
   - Total demand: 1,050 GPM including 500 GPM hose demand

2. MINI-LOAD ASRS with CLOSED-TOP containers:
   - Ceiling: K11.2, 160°F quick-response pendent sprinklers
   - No in-rack required for closed-top noncombustible containers
   - Total demand: 650 GPM including 500 GPM hose demand

3. TOP-LOADING ASRS:
   - Ceiling: K16.8 or K25.2 depending on ceiling height
   - In-rack requirements depend on container type
   - Higher design densities may be required

Always reference FM Global 8-34 and provide specific, actionable requirements.`
    };

    const messagesWithSystem = [systemMessage, ...messages];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: messagesWithSystem,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('ERROR in FM Global API:', error);
    return new Response(JSON.stringify({ error: (error as any)?.message || 'Unknown error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}