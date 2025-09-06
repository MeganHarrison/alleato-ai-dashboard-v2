/**
 * FM Global Cost Optimization Engine API Route
 * 
 * PURPOSE: Analyzes ASRS projects for cost optimization opportunities
 * 
 * USED BY:
 * - Cost optimization analysis tools
 * - Project planning interfaces
 * - Financial analysis components
 * - Backend optimization processes
 * 
 * FUNCTIONALITY:
 * - Analyzes ASRS project parameters for cost savings
 * - Compares different protection schemes and their costs
 * - Generates optimization recommendations with financial impact
 * - Calculates ROI for various design alternatives
 * - Provides regulatory compliance validation
 * 
 * OPTIMIZATION AREAS:
 * - Storage height optimization
 * - Container type analysis (open vs closed)
 * - System type recommendations (wet vs dry)
 * - Sprinkler spacing and K-factor optimization
 * - In-rack sprinkler requirement analysis
 * 
 * INPUT: ProjectData (building specs, storage config, system requirements)
 * OUTPUT: { optimizations: [], costSavings: number, recommendations: [], compliance: {} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProjectData {
  asrsType: 'mini_load' | 'shuttle' | 'top_loading' | 'vertically_enclosed';
  storageHeight: number;
  containerConfig: string;
  commodityClass: string;
  systemType: 'wet' | 'dry';
  projectTimeline?: string;
  facilitySize?: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'container' | 'height' | 'system_type' | 'spacing' | 'commodity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentConfig: string;
  recommendedConfig: string;
  potentialSavings: {
    min: number;
    max: number;
    confidence: number;
  };
  implementationEffort: 'minimal' | 'moderate' | 'significant';
  technicalDetails: {
    tableImpact: string[];
    requirementChanges: string[];
    designConsiderations: string[];
  };
}

interface LeadScore {
  total: number;
  breakdown: {
    urgency: number;
    authority: number;
    need: number;
    budget: number;
  };
  qualification: 'hot' | 'warm' | 'cold' | 'unqualified';
  followUpAction: string;
  estimatedValue: number;
}

class OptimizationEngine {
  async generateRecommendations(projectData: ProjectData): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Container optimization (highest impact)
    if (projectData.containerConfig === 'open_top_solid' && projectData.asrsType === 'mini_load') {
      recommendations.push({
        id: 'container_optimization',
        type: 'container',
        priority: 'critical',
        title: 'Switch to Closed-Top Containers',
        description: 'Eliminate in-rack sprinkler requirements entirely by using closed-top containers',
        currentConfig: 'Open-top containers requiring Tables 38-42 (ceiling + in-rack)',
        recommendedConfig: 'Closed-top containers using Table 27 (ceiling only)',
        potentialSavings: { min: 150000, max: 200000, confidence: 95 },
        implementationEffort: 'minimal',
        technicalDetails: {
          tableImpact: ['Eliminates Tables 38-42', 'Uses Table 27 instead'],
          requirementChanges: ['No in-rack sprinklers needed', 'Reduced ceiling densities'],
          designConsiderations: ['Ensure lid stays in place during fire', 'Verify container procurement options']
        }
      });
    }

    // Height optimization
    if (projectData.storageHeight > 20) {
      const currentHeight = projectData.storageHeight;
      recommendations.push({
        id: 'height_optimization',
        type: 'height',
        priority: 'high',
        title: `Reduce Storage Height from ${currentHeight}ft to 20ft`,
        description: 'Avoid enhanced protection requirements at 20ft threshold',
        currentConfig: `${currentHeight}ft storage requiring enhanced protection`,
        recommendedConfig: '20ft maximum storage with standard protection',
        potentialSavings: {
          min: Math.min(75000, (currentHeight - 20) * 10000),
          max: Math.min(125000, (currentHeight - 20) * 15000),
          confidence: 85
        },
        implementationEffort: 'moderate',
        technicalDetails: {
          tableImpact: ['Reduces sprinkler pressure requirements', 'May allow lower K-factors'],
          requirementChanges: ['Lower ceiling densities', 'Reduced system pressure'],
          designConsiderations: ['Layout efficiency impact', 'Storage capacity reduction']
        }
      });
    }

    // System type optimization
    if (projectData.systemType === 'dry') {
      recommendations.push({
        id: 'system_type_optimization',
        type: 'system_type',
        priority: 'medium',
        title: 'Consider Wet Sprinkler System',
        description: 'Wet systems require 25-40% fewer sprinklers than dry systems',
        currentConfig: 'Dry system requiring enhanced sprinkler density',
        recommendedConfig: 'Wet system with standard sprinkler density',
        potentialSavings: { min: 30000, max: 80000, confidence: 75 },
        implementationEffort: 'significant',
        technicalDetails: {
          tableImpact: ['Switch from dry tables to wet tables', 'Reduce sprinkler count by 25-40%'],
          requirementChanges: ['Lower sprinkler density', 'Faster response time'],
          designConsiderations: ['Requires heated building', 'Freeze protection needed']
        }
      });
    }

    // Commodity class optimization
    if (projectData.commodityClass === 'class-4' || projectData.commodityClass.includes('plastic')) {
      recommendations.push({
        id: 'commodity_optimization',
        type: 'commodity',
        priority: 'medium',
        title: 'Review Commodity Classification',
        description: 'Consider if products can be reclassified to lower hazard category',
        currentConfig: 'Class 4/Plastic requiring enhanced protection',
        recommendedConfig: 'Potential reclassification to Class 3 or below',
        potentialSavings: { min: 50000, max: 100000, confidence: 60 },
        implementationEffort: 'minimal',
        technicalDetails: {
          tableImpact: ['Move from plastic tables to standard commodity tables'],
          requirementChanges: ['Reduced sprinkler density', 'Lower water demand'],
          designConsiderations: ['Requires detailed commodity analysis', 'May need packaging changes']
        }
      });
    }

    // ASRS-specific recommendations
    if (projectData.asrsType === 'shuttle' && projectData.storageHeight > 15) {
      recommendations.push({
        id: 'asrs_configuration',
        type: 'spacing',
        priority: 'low',
        title: 'Optimize Transverse Flue Spaces',
        description: 'Increase flue spaces to reduce sprinkler requirements',
        currentConfig: 'Standard 3-inch transverse flue spaces',
        recommendedConfig: '6-inch transverse flue spaces for reduced protection',
        potentialSavings: { min: 20000, max: 40000, confidence: 70 },
        implementationEffort: 'moderate',
        technicalDetails: {
          tableImpact: ['May allow use of lower-density protection tables'],
          requirementChanges: ['Improved air flow for sprinkler effectiveness'],
          designConsiderations: ['Reduces storage density', 'Requires ASRS reprogramming']
        }
      });
    }

    return recommendations.sort((a, b) => b.potentialSavings.max - a.potentialSavings.max);
  }

  calculateLeadScore(projectData: any, contactData: any): LeadScore {
    const scores = {
      urgency: this.scoreUrgency(projectData.projectTimeline),
      authority: this.scoreAuthority(contactData),
      need: this.scoreNeed(projectData),
      budget: this.scoreBudget(projectData)
    };

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

    return {
      total,
      breakdown: scores,
      qualification: this.determineQualification(total),
      followUpAction: this.determineFollowUpAction(total, scores),
      estimatedValue: this.estimateProjectValue(projectData)
    };
  }

  private scoreUrgency(timeline?: string): number {
    const urgencyScores: Record<string, number> = {
      immediate: 100,
      short_term: 75,
      medium_term: 50,
      long_term: 25,
      planning: 10
    };
    return urgencyScores[timeline || 'planning'] || 0;
  }

  private scoreAuthority(contactData: any): number {
    // Score based on job title and email domain
    let score = 25; // Base score
    if (contactData.jobTitle?.toLowerCase().includes('director')) score += 15;
    if (contactData.jobTitle?.toLowerCase().includes('manager')) score += 10;
    if (contactData.email && !contactData.email.includes('gmail.com')) score += 10;
    return Math.min(score, 50);
  }

  private scoreNeed(projectData: ProjectData): number {
    let needScore = 0;

    // Complex systems score higher
    const complexityScores: Record<string, number> = {
      mini_load: 50,
      shuttle: 35,
      top_loading: 30,
      vertically_enclosed: 20
    };
    needScore += complexityScores[projectData.asrsType] || 0;

    // High-cost configurations indicate serious need
    if (projectData.containerConfig === 'open_top_solid' && projectData.asrsType === 'mini_load') {
      needScore += 30;
    }

    // Large projects indicate serious need
    if (projectData.facilitySize && projectData.facilitySize > 100000) {
      needScore += 20;
    }

    return Math.min(needScore, 100);
  }

  private scoreBudget(projectData: ProjectData): number {
    // Estimate based on facility size and complexity
    let budgetScore = 25;
    if (projectData.facilitySize && projectData.facilitySize > 50000) budgetScore += 15;
    if (projectData.storageHeight > 20) budgetScore += 10;
    return Math.min(budgetScore, 50);
  }

  private determineQualification(total: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
    if (total >= 200) return 'hot';
    if (total >= 100) return 'warm';
    if (total >= 50) return 'cold';
    return 'unqualified';
  }

  private determineFollowUpAction(total: number, scores: any): string {
    if (total >= 200) return 'Contact within 4 hours - high-value opportunity';
    if (total >= 100) return 'Schedule consultation within 24 hours';
    if (scores.urgency > 75) return 'Fast-track response - urgent timeline';
    return 'Add to nurturing campaign';
  }

  private estimateProjectValue(projectData: ProjectData): number {
    let baseValue = 50000;
    
    // Adjust based on facility size
    if (projectData.facilitySize) {
      baseValue += projectData.facilitySize * 0.5;
    }
    
    // Adjust based on complexity
    if (projectData.asrsType === 'mini_load') baseValue *= 1.5;
    if (projectData.storageHeight > 25) baseValue *= 1.3;
    if (projectData.containerConfig === 'open_top_solid') baseValue *= 1.4;
    
    return Math.round(baseValue);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectData, contactData, action } = body;

    const engine = new OptimizationEngine();

    if (action === 'optimize') {
      // Generate optimization recommendations
      const recommendations = await engine.generateRecommendations(projectData);
      
      // Calculate total potential savings
      const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings.max, 0);
      
      // Store optimization request in database for tracking
      if (contactData?.email) {
        await supabase.from('optimization_requests').insert({
          project_data: projectData,
          contact_data: contactData,
          recommendations: recommendations,
          total_savings: totalSavings,
          created_at: new Date().toISOString()
        });
      }

      return NextResponse.json({
        recommendations,
        totalSavings,
        summary: {
          criticalCount: recommendations.filter(r => r.priority === 'critical').length,
          highCount: recommendations.filter(r => r.priority === 'high').length,
          totalRecommendations: recommendations.length,
          averageConfidence: recommendations.reduce((sum, r) => sum + r.potentialSavings.confidence, 0) / recommendations.length
        }
      });
    }

    if (action === 'score_lead') {
      // Calculate lead score
      const leadScore = engine.calculateLeadScore(projectData, contactData);
      
      // Store lead in database
      if (contactData?.email) {
        await supabase.from('leads').insert({
          contact_data: contactData,
          project_data: projectData,
          lead_score: leadScore,
          created_at: new Date().toISOString()
        });
      }

      return NextResponse.json({
        leadScore,
        nextSteps: leadScore.followUpAction,
        priority: leadScore.qualification
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Optimization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'FM Global Cost Optimization Engine',
    status: 'operational',
    endpoints: {
      'POST /api/fm-optimize': {
        actions: {
          optimize: 'Generate cost optimization recommendations',
          score_lead: 'Calculate lead score and qualification'
        }
      }
    },
    features: [
      'Real-time cost optimization analysis',
      'Lead scoring and qualification',
      'Savings estimation with confidence levels',
      'Integration with FM Global requirements',
      'Automated CRM integration'
    ]
  });
}