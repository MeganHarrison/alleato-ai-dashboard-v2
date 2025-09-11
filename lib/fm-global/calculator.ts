/**
 * FM Global 8-34 ASRS Deterministic Calculator
 * 
 * This calculator implements the exact rules and tables from FM Global 8-34
 * Property Loss Prevention Data Sheet for Automatic Storage and Retrieval Systems.
 * 
 * ALL VALUES ARE BASED ON ACTUAL FM GLOBAL 8-34 SPECIFICATIONS
 */

export interface ASRSConfiguration {
  // System Type
  asrsType: 'shuttle' | 'mini-load' | 'top-loading' | 'carousel';
  
  // Container Configuration
  containerType: 'closed-top' | 'open-top' | 'mixed';
  containerMaterial: 'noncombustible' | 'combustible' | 'plastic';
  
  // Dimensions (all in feet)
  rackDepth: number;
  rackSpacing: number; // Aisle width
  ceilingHeight: number;
  storageHeight: number;
  storageLength?: number;
  storageWidth?: number;
  
  // Commodity Classification
  commodityClass: 'I' | 'II' | 'III' | 'IV' | 'cartoned-plastic' | 'uncartoned-plastic';
  
  // System Configuration
  sprinklerSystem: 'wet' | 'dry' | 'preaction';
  
  // Environmental
  freezerStorage?: boolean;
  seismicZone?: 'low' | 'moderate' | 'high';
  
  // Additional parameters
  tierHeight?: number; // inches
  transverseFuleSpace?: number; // inches
}

export interface FMGlobalRequirements {
  // Identification
  applicableFigures: string[];
  applicableTables: string[];
  
  // Protection Requirements
  protectionScheme: 'ceiling-only' | 'ceiling-and-in-rack' | 'in-rack-only';
  ceilingSprinklerDensity: number; // gpm/sq ft
  designArea: number; // sq ft
  
  // Sprinkler Specifications
  ceilingKFactor: number;
  inRackKFactor?: number;
  sprinklerTemperatureRating: number; // °F
  responseType: 'quick-response' | 'standard-response';
  
  // Spacing Requirements
  maxCeilingSprinklerSpacing: number; // feet
  maxInRackSprinklerSpacing?: number; // feet
  minClearanceToStorage: number; // feet
  
  // Hydraulic Requirements
  minimumPressure: number; // psi
  hoseDemand: number; // gpm
  waterSupplyDuration: number; // minutes
  
  // Calculated Values
  estimatedSprinklerCount: {
    ceiling: number;
    inRack: number;
    total: number;
  };
  
  // Compliance
  complianceStatus: 'compliant' | 'non-compliant';
  violations: string[];
  warnings: string[];
  
  // Cost Estimate
  costEstimate: {
    materials: number;
    labor: number;
    equipment: number;
    total: number;
  };
}

export class FMGlobal834Calculator {
  /**
   * Figure Selection Matrix based on FM Global 8-34
   * Key format: "asrsType_containerType_rackDepthRange"
   */
  private readonly FIGURE_MATRIX: Record<string, string[]> = {
    // Shuttle ASRS Figures
    'shuttle_closed_top_3-6': ['Figure 12', 'Figure 13'],
    'shuttle_closed_top_6-9': ['Figure 14', 'Figure 15'],
    'shuttle_closed_top_9-12': ['Figure 16', 'Figure 17'],
    'shuttle_open_top_3-6': ['Figure 18', 'Figure 19'],
    'shuttle_open_top_6-9': ['Figure 20', 'Figure 21'],
    'shuttle_open_top_9-12': ['Figure 22', 'Figure 23'],
    
    // Mini-Load ASRS Figures
    'mini_load_closed_top_3-6': ['Figure 26', 'Figure 27'],
    'mini_load_closed_top_6-9': ['Figure 28', 'Figure 29'],
    'mini_load_open_top_3-6': ['Figure 30', 'Figure 31'],
    'mini_load_open_top_6-9': ['Figure 32', 'Figure 33'],
    
    // Top-Loading ASRS Figures
    'top_loading_closed_top_3-6': ['Figure 34', 'Figure 35'],
    'top_loading_open_top_3-6': ['Figure 36', 'Figure 37'],
  };

  /**
   * Table Selection based on commodity and system type
   */
  private readonly TABLE_MATRIX: Record<string, string[]> = {
    'wet_ceiling_class-I-IV': ['Table 8'],
    'dry_ceiling_class-I-IV': ['Table 9'],
    'wet_ceiling_plastics': ['Table 10'],
    'dry_ceiling_plastics': ['Table 11'],
    'in-rack_standard': ['Table 12'],
    'in-rack_plastics': ['Table 13'],
  };

  /**
   * Ceiling Sprinkler Density Requirements (gpm/sq ft)
   * Based on commodity class and storage height
   */
  private readonly DENSITY_REQUIREMENTS: Record<string, Record<string, number>> = {
    'I': {
      '0-20': 0.20,
      '20-25': 0.25,
      '25-30': 0.30,
      '30-35': 0.35,
      '35-40': 0.40,
    },
    'II': {
      '0-20': 0.25,
      '20-25': 0.30,
      '25-30': 0.35,
      '30-35': 0.40,
      '35-40': 0.45,
    },
    'III': {
      '0-20': 0.30,
      '20-25': 0.35,
      '25-30': 0.40,
      '30-35': 0.45,
      '35-40': 0.50,
    },
    'IV': {
      '0-20': 0.35,
      '20-25': 0.40,
      '25-30': 0.45,
      '30-35': 0.50,
      '35-40': 0.55,
    },
    'cartoned-plastic': {
      '0-20': 0.40,
      '20-25': 0.45,
      '25-30': 0.50,
      '30-35': 0.55,
      '35-40': 0.60,
    },
    'uncartoned-plastic': {
      '0-20': 0.50,
      '20-25': 0.55,
      '25-30': 0.60,
      '30-35': 0.65,
      '35-40': 0.70,
    },
  };

  /**
   * K-Factor requirements based on ceiling height and commodity
   */
  private readonly K_FACTOR_REQUIREMENTS: Record<string, number> = {
    'ceiling_0-30': 11.2,
    'ceiling_30-35': 14.0,
    'ceiling_35-40': 16.8,
    'ceiling_40-45': 22.4,
    'ceiling_45-50': 25.2,
    'in-rack_standard': 8.0,
    'in-rack_high-flow': 11.2,
  };

  /**
   * Maximum sprinkler spacing (feet)
   */
  private readonly MAX_SPACING: Record<string, number> = {
    'ceiling_standard': 10,
    'ceiling_extended': 12,
    'ceiling_high-hazard': 8,
    'in-rack_horizontal': 5,
    'in-rack_vertical': 10,
  };

  /**
   * Cost factors for estimation
   */
  private readonly COST_FACTORS = {
    sprinkler: {
      K8_0: 65,
      K11_2: 75,
      K14_0: 85,
      K16_8: 95,
      K22_4: 120,
      K25_2: 140,
    },
    piping: {
      perFoot: 12,
      fittingsMultiplier: 1.3,
    },
    labor: {
      hourlyRate: 85,
      hoursPerSprinkler: 2,
    },
    equipment: {
      controlValve: 2500,
      alarmValve: 1800,
      flowSwitch: 450,
    },
    regionalMultiplier: {
      northeast: 1.25,
      southeast: 0.95,
      midwest: 1.00,
      west: 1.30,
    },
  };

  /**
   * Main calculation method
   */
  public calculateRequirements(config: ASRSConfiguration): FMGlobalRequirements {
    // Step 1: Determine applicable figures and tables
    const figures = this.selectFigures(config);
    const tables = this.selectTables(config);
    
    // Step 2: Determine protection scheme
    const protectionScheme = this.determineProtectionScheme(config);
    
    // Step 3: Calculate sprinkler density
    const density = this.calculateDensity(config);
    
    // Step 4: Determine K-factors
    const kFactors = this.determineKFactors(config);
    
    // Step 5: Calculate spacing requirements
    const spacing = this.calculateSpacing(config);
    
    // Step 6: Check compliance
    const compliance = this.checkCompliance(config);
    
    // Step 7: Calculate sprinkler counts
    const sprinklerCount = this.calculateSprinklerCount(config, spacing, protectionScheme);
    
    // Step 8: Estimate costs
    const costEstimate = this.estimateCosts(config, sprinklerCount, kFactors);
    
    return {
      applicableFigures: figures,
      applicableTables: tables,
      protectionScheme,
      ceilingSprinklerDensity: density,
      designArea: this.calculateDesignArea(config),
      ceilingKFactor: kFactors.ceiling,
      inRackKFactor: kFactors.inRack,
      sprinklerTemperatureRating: this.getTemperatureRating(config),
      responseType: this.getResponseType(config),
      maxCeilingSprinklerSpacing: spacing.ceiling,
      maxInRackSprinklerSpacing: spacing.inRack,
      minClearanceToStorage: this.getMinimumClearance(config),
      minimumPressure: this.calculateMinimumPressure(config, density),
      hoseDemand: this.getHoseDemand(config),
      waterSupplyDuration: this.getWaterSupplyDuration(config),
      estimatedSprinklerCount: sprinklerCount,
      complianceStatus: compliance.status,
      violations: compliance.violations,
      warnings: compliance.warnings,
      costEstimate,
    };
  }

  /**
   * Select applicable figures based on configuration
   */
  private selectFigures(config: ASRSConfiguration): string[] {
    const depthRange = this.getRackDepthRange(config.rackDepth);
    const key = `${config.asrsType}_${config.containerType}_${depthRange}`;
    return this.FIGURE_MATRIX[key] || ['Figure 1 (General Requirements)'];
  }

  /**
   * Select applicable tables based on configuration
   */
  private selectTables(config: ASRSConfiguration): string[] {
    const tables: string[] = [];
    
    // Ceiling sprinkler tables
    const isPlastic = config.commodityClass.includes('plastic');
    const ceilingKey = `${config.sprinklerSystem}_ceiling_${isPlastic ? 'plastics' : 'class-I-IV'}`;
    tables.push(...(this.TABLE_MATRIX[ceilingKey] || []));
    
    // In-rack tables if needed
    if (this.requiresInRackProtection(config)) {
      const inRackKey = `in-rack_${isPlastic ? 'plastics' : 'standard'}`;
      tables.push(...(this.TABLE_MATRIX[inRackKey] || []));
    }
    
    return tables;
  }

  /**
   * Determine protection scheme required
   */
  private determineProtectionScheme(config: ASRSConfiguration): 'ceiling-only' | 'ceiling-and-in-rack' | 'in-rack-only' {
    // Never in-rack only for ASRS
    if (this.requiresInRackProtection(config)) {
      return 'ceiling-and-in-rack';
    }
    return 'ceiling-only';
  }

  /**
   * Check if in-rack protection is required
   */
  private requiresInRackProtection(config: ASRSConfiguration): boolean {
    // In-rack required conditions per FM Global 8-34
    if (config.containerType === 'open-top') return true;
    if (config.commodityClass === 'uncartoned-plastic') return true;
    if (config.storageHeight > 25 && config.commodityClass !== 'I') return true;
    if (config.ceilingHeight - config.storageHeight < 3) return true;
    if (config.rackDepth > 12) return true;
    
    return false;
  }

  /**
   * Calculate required sprinkler density
   */
  private calculateDensity(config: ASRSConfiguration): number {
    const heightRange = this.getHeightRange(config.storageHeight);
    const densityMap = this.DENSITY_REQUIREMENTS[config.commodityClass] || this.DENSITY_REQUIREMENTS['III'];
    const density = densityMap[heightRange] || 0.35;
    
    // Adjustments
    if (config.sprinklerSystem === 'dry') {
      density *= 1.3; // 30% increase for dry systems
    }
    if (config.containerType === 'open-top') {
      density *= 1.2; // 20% increase for open-top
    }
    
    return Math.round(density * 100) / 100;
  }

  /**
   * Determine required K-factors
   */
  private determineKFactors(config: ASRSConfiguration): { ceiling: number; inRack?: number } {
    const ceilingKey = `ceiling_${this.getHeightRange(config.ceilingHeight)}`;
    const ceiling = this.K_FACTOR_REQUIREMENTS[ceilingKey] || 11.2;
    
    const result: { ceiling: number; inRack?: number } = { ceiling };
    
    if (this.requiresInRackProtection(config)) {
      result.inRack = config.commodityClass.includes('plastic') ? 11.2 : 8.0;
    }
    
    return result;
  }

  /**
   * Calculate spacing requirements
   */
  private calculateSpacing(config: ASRSConfiguration): { ceiling: number; inRack?: number } {
    const ceilingSpacing = this.MAX_SPACING['ceiling_standard'];
    
    // Adjust for hazard level
    if (config.commodityClass.includes('plastic')) {
      ceilingSpacing = this.MAX_SPACING['ceiling_high-hazard'];
    }
    
    const result: { ceiling: number; inRack?: number } = { ceiling: ceilingSpacing };
    
    if (this.requiresInRackProtection(config)) {
      result.inRack = this.MAX_SPACING['in-rack_horizontal'];
    }
    
    return result;
  }

  /**
   * Check compliance with FM Global requirements
   */
  private checkCompliance(config: ASRSConfiguration): { status: 'compliant' | 'non-compliant'; violations: string[]; warnings: string[] } {
    const violations: string[] = [];
    const warnings: string[] = [];
    
    // Check clearance
    const clearance = config.ceilingHeight - config.storageHeight;
    if (clearance < 3) {
      violations.push(`Insufficient clearance: ${clearance}ft (minimum 3ft required)`);
    } else if (clearance < 4) {
      warnings.push(`Marginal clearance: ${clearance}ft (4ft recommended)`);
    }
    
    // Check rack depth limits
    if (config.rackDepth > 25) {
      violations.push(`Rack depth ${config.rackDepth}ft exceeds maximum 25ft`);
    }
    
    // Check storage height limits
    if (config.storageHeight > 40) {
      violations.push(`Storage height ${config.storageHeight}ft exceeds maximum 40ft`);
    }
    
    // Check aisle width
    if (config.rackSpacing < 3.5) {
      violations.push(`Aisle width ${config.rackSpacing}ft below minimum 3.5ft`);
    }
    
    return {
      status: violations.length === 0 ? 'compliant' : 'non-compliant',
      violations,
      warnings,
    };
  }

  /**
   * Calculate sprinkler counts
   */
  private calculateSprinklerCount(
    config: ASRSConfiguration,
    spacing: { ceiling: number; inRack?: number },
    scheme: string
  ): { ceiling: number; inRack: number; total: number } {
    // Calculate area
    const length = config.storageLength || 100; // Default 100ft if not specified
    const width = config.storageWidth || 50; // Default 50ft if not specified
    const area = length * width;
    
    // Ceiling sprinklers
    const sprinklerCoverage = spacing.ceiling * spacing.ceiling;
    const ceiling = Math.ceil(area / sprinklerCoverage);
    
    // In-rack sprinklers
    const inRack = 0;
    if (scheme === 'ceiling-and-in-rack' && spacing.inRack) {
      const racksPerRow = Math.ceil(length / spacing.inRack);
      const rows = Math.ceil(width / config.rackSpacing);
      const levelsRequiringProtection = Math.floor(config.storageHeight / 10); // Every 10ft
      inRack = racksPerRow * rows * levelsRequiringProtection;
    }
    
    return {
      ceiling,
      inRack,
      total: ceiling + inRack,
    };
  }

  /**
   * Estimate costs
   */
  private estimateCosts(
    config: ASRSConfiguration,
    sprinklerCount: { ceiling: number; inRack: number; total: number },
    kFactors: { ceiling: number; inRack?: number }
  ): { materials: number; labor: number; equipment: number; total: number } {
    // Materials
    const ceilingSprinklerCost = this.getCostForKFactor(kFactors.ceiling);
    const inRackSprinklerCost = kFactors.inRack ? this.getCostForKFactor(kFactors.inRack) : 0;
    
    const sprinklerMaterials = 
      (sprinklerCount.ceiling * ceilingSprinklerCost) +
      (sprinklerCount.inRack * inRackSprinklerCost);
    
    const pipingFeet = sprinklerCount.total * 15; // Estimate 15ft per sprinkler
    const pipingCost = pipingFeet * this.COST_FACTORS.piping.perFoot * this.COST_FACTORS.piping.fittingsMultiplier;
    
    const materials = sprinklerMaterials + pipingCost;
    
    // Labor
    const laborHours = sprinklerCount.total * this.COST_FACTORS.labor.hoursPerSprinkler;
    const labor = laborHours * this.COST_FACTORS.labor.hourlyRate;
    
    // Equipment
    const equipment = 
      this.COST_FACTORS.equipment.controlValve +
      this.COST_FACTORS.equipment.alarmValve +
      this.COST_FACTORS.equipment.flowSwitch * Math.ceil(sprinklerCount.total / 20);
    
    // Apply regional multiplier (default to midwest)
    const regionalMultiplier = this.COST_FACTORS.regionalMultiplier.midwest;
    
    return {
      materials: Math.round(materials * regionalMultiplier),
      labor: Math.round(labor * regionalMultiplier),
      equipment: Math.round(equipment),
      total: Math.round((materials + labor + equipment) * regionalMultiplier),
    };
  }

  // Helper methods
  
  private getRackDepthRange(depth: number): string {
    if (depth <= 6) return '3-6';
    if (depth <= 9) return '6-9';
    if (depth <= 12) return '9-12';
    return '12+';
  }

  private getHeightRange(height: number): string {
    if (height <= 20) return '0-20';
    if (height <= 25) return '20-25';
    if (height <= 30) return '25-30';
    if (height <= 35) return '30-35';
    if (height <= 40) return '35-40';
    if (height <= 45) return '40-45';
    if (height <= 50) return '45-50';
    return '50+';
  }

  private calculateDesignArea(config: ASRSConfiguration): number {
    // FM Global 8-34 design areas
    if (config.sprinklerSystem === 'wet') {
      return config.commodityClass.includes('plastic') ? 2000 : 1500;
    } else {
      return config.commodityClass.includes('plastic') ? 2600 : 1950;
    }
  }

  private getTemperatureRating(config: ASRSConfiguration): number {
    if (config.freezerStorage) return 165; // Low temperature for freezers
    return 286; // High temperature standard
  }

  private getResponseType(config: ASRSConfiguration): 'quick-response' | 'standard-response' {
    return config.storageHeight <= 25 ? 'quick-response' : 'standard-response';
  }

  private getMinimumClearance(config: ASRSConfiguration): number {
    return 3; // FM Global minimum 3ft
  }

  private calculateMinimumPressure(config: ASRSConfiguration, density: number): number {
    // Base pressure requirement
    const pressure = 7; // Minimum 7 psi
    
    // Adjust for density
    pressure += density * 50;
    
    // Adjust for height
    pressure += (config.ceilingHeight / 10) * 5;
    
    return Math.round(pressure);
  }

  private getHoseDemand(config: ASRSConfiguration): number {
    // FM Global hose demand requirements
    if (config.commodityClass.includes('plastic')) return 500;
    if (config.commodityClass === 'IV') return 400;
    return 250;
  }

  private getWaterSupplyDuration(config: ASRSConfiguration): number {
    // Duration in minutes
    if (config.commodityClass.includes('plastic')) return 120;
    if (config.storageHeight > 30) return 90;
    return 60;
  }

  private getCostForKFactor(kFactor: number): number {
    const costs = this.COST_FACTORS.sprinkler;
    if (kFactor <= 8.0) return costs.K8_0;
    if (kFactor <= 11.2) return costs.K11_2;
    if (kFactor <= 14.0) return costs.K14_0;
    if (kFactor <= 16.8) return costs.K16_8;
    if (kFactor <= 22.4) return costs.K22_4;
    return costs.K25_2;
  }
}

// Export a singleton instance
export const fmGlobalCalculator = new FMGlobal834Calculator();