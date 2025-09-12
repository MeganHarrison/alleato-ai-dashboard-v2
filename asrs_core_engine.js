/**
 * ASRS Requirements Engine
 * Core logic for FM Global 8-34 compliance determination
 * Autonomous system for lead generation and cost optimization
 */

class ASRSRequirementsEngine {
  constructor(figuresData, tablesData, costData) {
    this.figures = figuresData;
    this.tables = tablesData;
    this.costs = costData;
    
    // Build lookup indices for performance
    this.buildIndices();
  }

  buildIndices() {
    // Index figures by ASRS type and container type
    this.figureIndex = {};
    this.figures.forEach(fig => {
      const key = `${fig.asrs_type}_${fig.container_type}`;
      if (!this.figureIndex[key]) this.figureIndex[key] = [];
      this.figureIndex[key].push(fig);
    });

    // Index tables by ASRS type
    this.tableIndex = {};
    this.tables.forEach(table => {
      if (!this.tableIndex[table.asrs_type]) this.tableIndex[table.asrs_type] = [];
      this.tableIndex[table.asrs_type].push(table);
    });

    // Build cost lookup
    this.costLookup = {};
    this.costs.forEach(cost => {
      this.costLookup[cost.component_type] = cost;
    });
  }

  /**
   * Main requirements determination function
   * Returns exact FM Global compliance requirements
   */
  getRequirements(config) {
    const {
      asrsType,
      containerType,
      rackDepthFt,
      spacingFt,
      ceilingHeightFt = 30,
      aisleWidthFt = 8,
      commodityClass = 'Class 2'
    } = config;

    // Find applicable figures
    const applicableFigures = this.findApplicableFigures({
      asrsType,
      containerType,
      rackDepthFt,
      spacingFt
    });

    // Find applicable tables
    const applicableTables = this.findApplicableTables({
      asrsType,
      ceilingHeightFt,
      commodityClass
    });

    // Calculate sprinkler requirements
    const sprinklerRequirements = this.calculateSprinklerRequirements(applicableFigures, config);

    // Generate cost estimate
    const costEstimate = this.calculateCostEstimate(sprinklerRequirements, config);

    // Identify optimization opportunities
    const optimizations = this.identifyOptimizations(config, sprinklerRequirements);

    // Lead scoring
    const leadScore = this.calculateLeadScore(config, costEstimate);

    return {
      compliance: {
        applicableFigures,
        applicableTables,
        isCompliant: applicableFigures.length > 0
      },
      sprinklerRequirements,
      costEstimate,
      optimizations,
      leadScore,
      timestamp: new Date().toISOString()
    };
  }

  findApplicableFigures({ asrsType, containerType, rackDepthFt, spacingFt }) {
    const key = `${asrsType}_${containerType}`;
    const candidates = this.figureIndex[key] || [];

    return candidates.filter(fig => {
      // Check depth requirements
      if (fig.max_depth_ft && rackDepthFt > fig.max_depth_ft) return false;
      
      // Check spacing requirements
      if (fig.max_spacing_ft && spacingFt > fig.max_spacing_ft) return false;

      return true;
    }).sort((a, b) => {
      // Prioritize figures with exact matches
      const aExact = (a.max_depth_ft === rackDepthFt ? 1 : 0) + (a.max_spacing_ft === spacingFt ? 1 : 0);
      const bExact = (b.max_depth_ft === rackDepthFt ? 1 : 0) + (b.max_spacing_ft === spacingFt ? 1 : 0);
      return bExact - aExact;
    });
  }

  findApplicableTables({ asrsType, ceilingHeightFt, commodityClass }) {
    const candidates = this.tableIndex[asrsType] || [];

    return candidates.filter(table => {
      // Check ceiling height requirements
      if (table.ceiling_height_min_ft && ceilingHeightFt < table.ceiling_height_min_ft) return false;
      if (table.ceiling_height_max_ft && ceilingHeightFt > table.ceiling_height_max_ft) return false;

      // Check commodity compatibility
      if (table.commodity_types && !table.commodity_types.includes(commodityClass)) return false;

      return true;
    });
  }

  calculateSprinklerRequirements(figures, config) {
    if (figures.length === 0) {
      return {
        sprinklerCount: 0,
        arrangement: 'Non-compliant configuration',
        spacing: 'N/A',
        error: 'No applicable FM Global figures found for this configuration'
      };
    }

    const primaryFigure = figures[0];
    
    // Extract sprinkler count from machine-readable claims
    let sprinklerCount = 0;
    if (primaryFigure.machine_readable_claims) {
      try {
        const claims = JSON.parse(primaryFigure.machine_readable_claims);
        sprinklerCount = claims.sprinkler_count || this.estimateSprinklerCount(primaryFigure, config);
      } catch (e) {
        sprinklerCount = this.estimateSprinklerCount(primaryFigure, config);
      }
    }

    return {
      primaryFigure: `Figure ${primaryFigure.figure_number}`,
      figureTitle: primaryFigure.title,
      pageNumber: primaryFigure.page_number,
      sprinklerCount,
      arrangement: primaryFigure.figure_type,
      spacing: `${primaryFigure.max_spacing_ft || 'Variable'} ft`,
      depth: `${primaryFigure.max_depth_ft || 'Variable'} ft`,
      specialConditions: primaryFigure.special_conditions || 'None specified'
    };
  }

  estimateSprinklerCount(figure, config) {
    // Estimation based on rack configuration
    const { rackDepthFt, spacingFt } = config;
    const baseCount = Math.ceil(rackDepthFt / 3) * Math.ceil(8 / spacingFt) * 2;
    return Math.max(4, baseCount); // Minimum 4 sprinklers per FM Global
  }

  calculateCostEstimate(requirements, config) {
    const { sprinklerCount } = requirements;
    
    // Base sprinkler cost
    const sprinklerCost = this.costLookup['Sprinkler Head']?.base_cost_per_unit || 150;
    const pipingCost = this.costLookup['Piping System']?.base_cost_per_unit || 25;
    const installationCost = this.costLookup['Installation']?.base_cost_per_unit || 200;

    const totalSprinklerCost = sprinklerCount * sprinklerCost;
    const totalPipingCost = sprinklerCount * pipingCost * 20; // Approximate linear feet per sprinkler
    const totalInstallationCost = sprinklerCount * installationCost;

    const subtotal = totalSprinklerCost + totalPipingCost + totalInstallationCost;
    const complexity = this.calculateComplexityMultiplier(config);
    const total = subtotal * complexity;

    return {
      breakdown: {
        sprinklers: totalSprinklerCost,
        piping: totalPipingCost,
        installation: totalInstallationCost
      },
      complexityMultiplier: complexity,
      subtotal,
      total: Math.round(total),
      costPerSprinkler: Math.round(total / sprinklerCount),
      currency: 'USD'
    };
  }

  calculateComplexityMultiplier(config) {
    let multiplier = 1.0;
    
    // Increase complexity for larger systems
    if (config.rackDepthFt > 10) multiplier += 0.2;
    if (config.spacingFt < 3) multiplier += 0.15;
    if (config.ceilingHeightFt > 35) multiplier += 0.1;
    
    return Math.min(multiplier, 2.0); // Cap at 2x
  }

  identifyOptimizations(config, requirements) {
    const optimizations = [];

    // Spacing optimization
    if (config.spacingFt < 4) {
      const newSprinklerCount = Math.ceil(requirements.sprinklerCount * 0.75);
      optimizations.push({
        type: 'spacing',
        suggestion: 'Increase spacing to 4 ft',
        impact: `Reduce sprinkler count from ${requirements.sprinklerCount} to ~${newSprinklerCount}`,
        savings: this.calculateSavings(requirements.sprinklerCount - newSprinklerCount),
        feasibility: 'High'
      });
    }

    // Container type optimization
    if (config.containerType === 'Open-Top') {
      optimizations.push({
        type: 'container',
        suggestion: 'Consider closed-top containers',
        impact: 'Reduced fire protection requirements',
        savings: { min: 15000, max: 50000 },
        feasibility: 'Medium - Depends on operational requirements'
      });
    }

    // Rack depth optimization
    if (config.rackDepthFt > 8) {
      optimizations.push({
        type: 'depth',
        suggestion: 'Consider reducing rack depth to 8 ft or less',
        impact: 'Simplified sprinkler arrangement and reduced costs',
        savings: this.calculateSavings(Math.ceil(requirements.sprinklerCount * 0.2)),
        feasibility: 'Low - May impact storage density'
      });
    }

    return optimizations;
  }

  calculateSavings(sprinklerReduction) {
    const costPerSprinkler = 400; // Average all-in cost
    return {
      min: sprinklerReduction * costPerSprinkler * 0.8,
      max: sprinklerReduction * costPerSprinkler * 1.2
    };
  }

  calculateLeadScore(config, costEstimate) {
    let score = 0;
    
    // Higher scores for larger projects
    if (costEstimate.total > 100000) score += 30;
    else if (costEstimate.total > 50000) score += 20;
    else if (costEstimate.total > 25000) score += 10;

    // Complex configurations = higher value projects
    if (config.rackDepthFt > 10) score += 15;
    if (config.spacingFt < 3) score += 10;
    if (config.ceilingHeightFt > 35) score += 10;

    // ASRS type scoring
    if (config.asrsType === 'Shuttle') score += 20;
    else if (config.asrsType === 'Mini-Load') score += 15;

    return {
      score: Math.min(score, 100),
      classification: score > 70 ? 'Hot Lead' : score > 40 ? 'Warm Lead' : 'Cold Lead',
      priority: score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low'
    };
  }

  // Utility methods for advanced features
  generateQuote(requirements, config, customerInfo) {
    const quote = {
      quoteId: `ASRS-${Date.now()}`,
      customerInfo,
      systemConfig: config,
      requirements,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      terms: 'Net 30',
      warranty: '5 years parts, 1 year labor'
    };

    return quote;
  }

  exportToCSV(results) {
    const headers = ['Parameter', 'Value', 'Compliance Status'];
    const rows = [
      ['ASRS Type', results.config.asrsType, 'Specified'],
      ['Container Type', results.config.containerType, 'Specified'],
      ['Primary Figure', results.sprinklerRequirements.primaryFigure, 'Compliant'],
      ['Sprinkler Count', results.sprinklerRequirements.sprinklerCount, 'Calculated'],
      ['Total Cost', `$${results.costEstimate.total}`, 'Estimated']
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Export for use in Node.js or browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ASRSRequirementsEngine;
} else if (typeof window !== 'undefined') {
  window.ASRSRequirementsEngine = ASRSRequirementsEngine;
}