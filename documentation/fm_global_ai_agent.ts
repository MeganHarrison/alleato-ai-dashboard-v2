// FM Global 8-34 AI Agent - Advanced Multi-Vector RAG System
// This agent uses multiple specialized vector stores for ASRS sprinkler design

interface ASRSConfiguration {
  asrs_type: 'Shuttle' | 'Mini-Load' | 'Horizontal Carousel';
  container_type: 'Closed-Top' | 'Open-Top' | 'Mixed';
  rack_depth_ft: number;
  rack_spacing_ft: number;
  ceiling_height_ft: number;
  aisle_width_ft: number;
  commodity_type: string[];
  storage_height_ft: number;
  system_type: 'wet' | 'dry' | 'both';
}

interface FMGlobalRAGAgent {
  // Multi-vector search across all databases
  searchMultiVector(query: string, config?: ASRSConfiguration): Promise<SearchResult>;
  
  // Specialized searches for different content types
  searchFigures(criteria: FigureSearchCriteria): Promise<FigureResult[]>;
  searchTables(criteria: TableSearchCriteria): Promise<TableResult[]>;
  searchRegulations(query: string): Promise<RegulationResult[]>;
  
  // Design generation and validation
  generateDesign(config: ASRSConfiguration): Promise<DesignResult>;
  validateDesign(design: DesignResult): Promise<ValidationResult>;
  optimizeForCost(design: DesignResult): Promise<OptimizationSuggestions>;
  
  // Quote generation
  generateQuote(design: DesignResult): Promise<QuoteResult>;
}

class FMGlobal834Agent implements FMGlobalRAGAgent {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  
  constructor(supabaseUrl: string, supabaseKey: string, openaiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  async searchMultiVector(query: string, config?: ASRSConfiguration): Promise<SearchResult> {
    // Step 1: Generate embeddings for the query
    const embedding = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    // Step 2: Parallel search across all vector stores
    const [figureResults, tableResults, textResults] = await Promise.all([
      this.searchFigureVectors(embedding.data[0].embedding, config),
      this.searchTableVectors(embedding.data[0].embedding, config),
      this.searchTextVectors(embedding.data[0].embedding)
    ]);

    // Step 3: Intelligent result fusion and ranking
    const fusedResults = this.fuseAndRankResults(figureResults, tableResults, textResults, query, config);

    // Step 4: Generate contextual response using GPT-4
    const response = await this.generateContextualResponse(fusedResults, query, config);

    return {
      answer: response,
      sources: fusedResults,
      confidence: this.calculateConfidence(fusedResults),
      related_figures: figureResults.map(r => r.figure_number),
      related_tables: tableResults.map(r => r.table_number),
      cost_impact: await this.estimateCostImpact(fusedResults, config)
    };
  }

  private async searchFigureVectors(embedding: number[], config?: ASRSConfiguration): Promise<FigureResult[]> {
    let query = this.supabase
      .from('fm_global_figures')
      .select(`
        *,
        similarity: fm_global_figures.embedding <=> '[${embedding.join(',')}]'
      `)
      .order('similarity', { ascending: true })
      .limit(5);

    // Apply configuration filters
    if (config) {
      if (config.asrs_type) query = query.eq('asrs_type', config.asrs_type);
      if (config.container_type) query = query.eq('container_type', config.container_type);
      if (config.rack_depth_ft) query = query.gte('max_depth_ft', config.rack_depth_ft);
      if (config.rack_spacing_ft) query = query.gte('max_spacing_ft', config.rack_spacing_ft);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(row => ({
      figure_number: row.figure_number,
      title: row.title,
      summary: row.normalized_summary,
      machine_claims: JSON.parse(row.machine_readable_claims || '{}'),
      page_number: row.page_number,
      similarity: row.similarity,
      applicable_conditions: this.extractApplicableConditions(row, config)
    }));
  }

  private async searchTableVectors(embedding: number[], config?: ASRSConfiguration): Promise<TableResult[]> {
    // Search the vectorized table content
    const { data, error } = await this.supabase
      .from('fm_table_vectors')
      .select(`
        *,
        similarity: embedding <=> '[${embedding.join(',')}]'
      `)
      .order('similarity', { ascending: true })
      .limit(10);

    if (error) throw error;

    // Enrich with table metadata
    const tableIds = data.map(row => row.table_id);
    const { data: tableData } = await this.supabase
      .from('fm_global_tables')
      .select('*')
      .in('table_id', tableIds);

    return data.map(vectorRow => {
      const tableRow = tableData?.find(t => t.table_id === vectorRow.table_id);
      return {
        table_number: tableRow?.table_number,
        title: tableRow?.title,
        content: vectorRow.content_text,
        design_parameters: JSON.parse(tableRow?.design_parameters || '{}'),
        protection_scheme: tableRow?.protection_scheme,
        similarity: vectorRow.similarity,
        applicable_conditions: this.extractTableConditions(tableRow, config)
      };
    });
  }

  private async searchTextVectors(embedding: number[]): Promise<RegulationResult[]> {
    const { data, error } = await this.supabase
      .from('fm_text_chunks')
      .select(`
        *,
        similarity: embedding <=> '[${embedding.join(',')}]'
      `)
      .order('similarity', { ascending: true })
      .limit(5);

    if (error) throw error;

    return data.map(row => ({
      section_path: row.section_path,
      content: row.raw_text,
      requirements: row.extracted_requirements,
      compliance_type: row.compliance_type,
      page_number: row.page_number,
      similarity: row.similarity
    }));
  }

  private fuseAndRankResults(
    figures: FigureResult[], 
    tables: TableResult[], 
    texts: RegulationResult[],
    query: string,
    config?: ASRSConfiguration
  ): FusedResult[] {
    const allResults = [
      ...figures.map(f => ({ ...f, type: 'figure', relevance_score: this.calculateFigureRelevance(f, query, config) })),
      ...tables.map(t => ({ ...t, type: 'table', relevance_score: this.calculateTableRelevance(t, query, config) })),
      ...texts.map(r => ({ ...r, type: 'regulation', relevance_score: this.calculateTextRelevance(r, query) }))
    ];

    // Advanced ranking algorithm combining semantic similarity + configuration match + content relevance
    return allResults
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 15); // Top 15 most relevant results
  }

  async generateDesign(config: ASRSConfiguration): Promise<DesignResult> {
    // Step 1: Find applicable figures based on configuration
    const applicableFigures = await this.findApplicableFigures(config);
    
    // Step 2: Find applicable tables for design parameters
    const applicableTables = await this.findApplicableTables(config);
    
    // Step 3: Extract design requirements
    const requirements = await this.extractDesignRequirements(applicableTables, config);
    
    // Step 4: Calculate sprinkler quantities and spacing
    const calculations = await this.performDesignCalculations(requirements, config);
    
    // Step 5: Generate equipment specifications
    const equipment = await this.generateEquipmentSpec(calculations, config);
    
    // Step 6: Validate against regulations
    const validation = await this.validateDesign({ ...calculations, equipment });

    return {
      configuration: config,
      applicable_figures: applicableFigures,
      applicable_tables: applicableTables,
      sprinkler_count: calculations.sprinkler_count,
      sprinkler_spacing: calculations.spacing,
      protection_scheme: requirements.protection_scheme,
      equipment_list: equipment,
      estimated_cost: await this.calculateCost(equipment),
      validation_status: validation,
      optimization_opportunities: await this.identifyOptimizations(config, calculations)
    };
  }

  private async calculateCost(equipment: EquipmentList): Promise<CostBreakdown> {
    const { data: costFactors } = await this.supabase
      .from('fm_cost_factors')
      .select('*');

    let totalCost = 0;
    const breakdown: CostBreakdown = { items: [], subtotal: 0, labor: 0, total: 0 };

    for (const item of equipment.items) {
      const factor = costFactors?.find(f => 
        f.component_type === item.type && 
        f.factor_name === item.specification
      );

      if (factor) {
        const itemCost = factor.base_cost_per_unit * item.quantity * factor.complexity_multiplier;
        breakdown.items.push({
          description: `${item.specification} (${item.quantity} ${factor.unit_type})`,
          unit_cost: factor.base_cost_per_unit,
          quantity: item.quantity,
          total: itemCost
        });
        totalCost += itemCost;
      }
    }

    breakdown.subtotal = totalCost;
    breakdown.labor = totalCost * 0.3; // 30% labor estimate
    breakdown.total = breakdown.subtotal + breakdown.labor;

    return breakdown;
  }

  async optimizeForCost(design: DesignResult): Promise<OptimizationSuggestions> {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze spacing optimization opportunities
    if (design.sprinkler_spacing < design.configuration.rack_spacing_ft * 0.8) {
      const potentialSavings = await this.calculateSpacingOptimization(design);
      suggestions.push({
        type: 'spacing_optimization',
        description: `Increase sprinkler spacing from ${design.sprinkler_spacing}ft to ${potentialSavings.new_spacing}ft`,
        estimated_savings: potentialSavings.cost_reduction,
        feasibility: 'high',
        requirements_impact: potentialSavings.compliance_notes
      });
    }

    // Analyze protection scheme alternatives
    const alternativeSchemes = await this.findAlternativeProtectionSchemes(design.configuration);
    for (const scheme of alternativeSchemes) {
      if (scheme.estimated_cost < design.estimated_cost.total) {
        suggestions.push({
          type: 'protection_scheme',
          description: `Switch to ${scheme.name} protection scheme`,
          estimated_savings: design.estimated_cost.total - scheme.estimated_cost,
          feasibility: scheme.feasibility,
          requirements_impact: scheme.trade_offs
        });
      }
    }

    // Analyze container type modifications
    if (design.configuration.container_type === 'Open-Top') {
      const closedTopSavings = await this.calculateClosedTopSavings(design.configuration);
      if (closedTopSavings.feasible) {
        suggestions.push({
          type: 'container_modification',
          description: 'Switch to closed-top containers to reduce protection requirements',
          estimated_savings: closedTopSavings.cost_reduction,
          feasibility: 'medium',
          requirements_impact: closedTopSavings.operational_impact
        });
      }
    }

    return {
      suggestions,
      total_potential_savings: suggestions.reduce((sum, s) => sum + s.estimated_savings, 0),
      implementation_priority: suggestions.sort((a, b) => b.estimated_savings - a.estimated_savings)
    };
  }

  // Form generation helper
  generateFormQuestions(currentAnswers: Partial<ASRSConfiguration> = {}): FormQuestion[] {
    const questions: FormQuestion[] = [
      {
        id: 'asrs_type',
        type: 'select',
        question: 'What type of ASRS system are you implementing?',
        options: [
          { value: 'Shuttle', label: 'Shuttle ASRS', description: 'Horizontal loading with shuttle mechanism' },
          { value: 'Mini-Load', label: 'Mini-Load ASRS', description: 'Vertical loading for smaller items' },
          { value: 'Horizontal Carousel', label: 'Horizontal Carousel', description: 'Rotating carousel system' }
        ],
        required: true,
        helpText: 'This determines the applicable FM Global tables and protection requirements'
      },
      {
        id: 'container_type',
        type: 'select',
        question: 'What type of containers will be stored?',
        options: [
          { value: 'Closed-Top', label: 'Closed-Top Containers', description: 'Fully enclosed storage containers' },
          { value: 'Open-Top', label: 'Open-Top Containers', description: 'Open containers or exposed products' },
          { value: 'Mixed', label: 'Mixed Container Types', description: 'Combination of closed and open containers' }
        ],
        required: true,
        conditional: (answers) => answers.asrs_type !== undefined
      }
      // ... more questions would be generated based on previous answers
    ];

    // Filter questions based on current answers and conditional logic
    return questions.filter(q => !q.conditional || q.conditional(currentAnswers));
  }
}

// Usage Examples:
const agent = new FMGlobal834Agent(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  process.env.OPENAI_API_KEY!
);

// Example 1: Natural language query
const query = await agent.searchMultiVector(
  "What are the sprinkler spacing requirements for a 20ft deep shuttle ASRS with closed-top containers?",
  {
    asrs_type: 'Shuttle',
    container_type: 'Closed-Top',
    rack_depth_ft: 20,
    rack_spacing_ft: 4,
    ceiling_height_ft: 32,
    aisle_width_ft: 8,
    commodity_type: ['Class II Commodities'],
    storage_height_ft: 28,
    system_type: 'wet'
  }
);

// Example 2: Full design generation
const design = await agent.generateDesign({
  asrs_type: 'Mini-Load',
  container_type: 'Open-Top',
  rack_depth_ft: 6,
  rack_spacing_ft: 3,
  ceiling_height_ft: 24,
  aisle_width_ft: 6,
  commodity_type: ['Cartoned Unexpanded Plastics'],
  storage_height_ft: 20,
  system_type: 'wet'
});

// Example 3: Cost optimization
const optimizations = await agent.optimizeForCost(design);

export { FMGlobal834Agent, type ASRSConfiguration, type DesignResult };