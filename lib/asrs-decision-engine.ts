/**
 * ASRS Decision Engine - Deterministic FM Global 8-34 Compliance
 * Integrates directly with Alleato dashboard
 */

export interface ASRSInput {
  asrsType: 'Shuttle' | 'Mini-Load';
  containerType: 'Closed-Top' | 'Open-Top';
  rackDepth: number;
  rackSpacing: number;
  ceilingHeight?: number;
  commodityType?: string;
  storageHeight?: number;
}

export interface ASRSRequirements {
  compliance: {
    applicableFigure: number | null;
    applicableTable: number | null;
    pageReference: number | null;
    isCompliant: boolean;
    figureTitle: string | null;
  };
  specifications: {
    sprinklerCount: number;
    sprinklerNumbering: string;
    spacing: number | null;
    rackDepth: number | null;
    protectionScheme: string;
    flueSpacesRequired: boolean;
    verticalBarriersRequired: boolean;
  };
  warnings: string[];
  metadata: {
    searchKey: string;
    matchType: 'exact' | 'closest' | 'none';
    timestamp: string;
  };
}

interface DecisionMatrixEntry {
  figureNumber: number;
  asrsType: string;
  containerType: string;
  maxDepth: number;
  maxSpacing: number;
  sprinklerCount: number;
  sprinklerNumbering: string;
  pageNumber: number;
  title: string;
  requiresFlueSpaces: boolean;
  requiresVerticalBarriers: boolean;
}

interface TableMatrixEntry {
  tableNumber: number;
  asrsType: string;
  protectionScheme: string;
  commodityTypes: string[];
  ceilingHeightMin?: number;
  ceilingHeightMax?: number;
  storageHeightMax?: number;
}

export class ASRSDecisionEngine {
  private decisionMatrix: Record<string, DecisionMatrixEntry>;
  private tableMatrix: TableMatrixEntry[];

  constructor() {
    this.decisionMatrix = this.initializeDecisionMatrix();
    this.tableMatrix = this.initializeTableMatrix();
  }

  /**
   * Main method: Get exact design requirements
   */
  getDesignRequirements(userInput: ASRSInput): ASRSRequirements {
    const {
      asrsType,
      containerType,
      rackDepth,
      rackSpacing,
      ceilingHeight,
      commodityType,
      storageHeight
    } = userInput;

    // Step 1: Find exact figure match
    const figureResult = this.findExactFigure({
      asrsType,
      containerType,
      rackDepth,
      rackSpacing
    });

    // Step 2: Find applicable table
    const tableResult = this.findApplicableTable({
      asrsType,
      commodityType,
      ceilingHeight,
      storageHeight
    });

    // Step 3: Generate warnings
    const warnings = this.generateWarnings(figureResult, userInput);

    return {
      compliance: {
        applicableFigure: figureResult?.figureNumber || null,
        applicableTable: tableResult?.tableNumber || null,
        pageReference: figureResult?.pageNumber || null,
        isCompliant: !!(figureResult && tableResult),
        figureTitle: figureResult?.title || null
      },
      specifications: {
        sprinklerCount: figureResult?.sprinklerCount || 0,
        sprinklerNumbering: figureResult?.sprinklerNumbering || '',
        spacing: figureResult?.maxSpacing || null,
        rackDepth: figureResult?.maxDepth || null,
        protectionScheme: tableResult?.protectionScheme || 'Unknown',
        flueSpacesRequired: figureResult?.requiresFlueSpaces || false,
        verticalBarriersRequired: figureResult?.requiresVerticalBarriers || false
      },
      warnings,
      metadata: {
        searchKey: this.createSearchKey(asrsType, containerType, rackDepth, rackSpacing),
        matchType: figureResult ? 'exact' : 'none',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get available configuration options for form generation
   */
  getAvailableConfigurations() {
    const configs = Object.values(this.decisionMatrix);
    
    return {
      asrsTypes: [...new Set(configs.map(c => c.asrsType))],
      containerTypes: [...new Set(configs.map(c => c.containerType))],
      availableDepths: [...new Set(configs.map(c => c.maxDepth))].sort((a, b) => a - b),
      availableSpacings: [...new Set(configs.map(c => c.maxSpacing))].sort((a, b) => a - b),
      commodityTypes: ['Class I', 'Class II', 'Class III', 'Class IV']
    };
  }

  private findExactFigure(criteria: {
    asrsType: string;
    containerType: string;
    rackDepth: number;
    rackSpacing: number;
  }): DecisionMatrixEntry | null {
    const searchKey = this.createSearchKey(
      criteria.asrsType,
      criteria.containerType,
      criteria.rackDepth,
      criteria.rackSpacing
    );

    const exactMatch = this.decisionMatrix[searchKey];
    
    if (exactMatch) {
      return exactMatch;
    }

    // Find closest match
    return this.findClosestFigure(criteria);
  }

  private findClosestFigure(criteria: {
    asrsType: string;
    containerType: string;
    rackDepth: number;
    rackSpacing: number;
  }): DecisionMatrixEntry | null {
    const candidates = Object.values(this.decisionMatrix).filter(figure =>
      figure.asrsType === criteria.asrsType &&
      figure.containerType === criteria.containerType
    );

    if (candidates.length === 0) return null;

    return candidates.reduce((best, current) => {
      const currentDepthDiff = Math.abs(current.maxDepth - criteria.rackDepth);
      const bestDepthDiff = best ? Math.abs(best.maxDepth - criteria.rackDepth) : Infinity;
      
      if (currentDepthDiff < bestDepthDiff) {
        return current;
      } else if (currentDepthDiff === bestDepthDiff) {
        const currentSpacingDiff = Math.abs(current.maxSpacing - criteria.rackSpacing);
        const bestSpacingDiff = Math.abs(best.maxSpacing - criteria.rackSpacing);
        return currentSpacingDiff < bestSpacingDiff ? current : best;
      }
      
      return best;
    }, null);
  }

  private findApplicableTable(criteria: {
    asrsType: string;
    commodityType?: string;
    ceilingHeight?: number;
    storageHeight?: number;
  }): TableMatrixEntry | null {
    const applicableTables = this.tableMatrix.filter(table => {
      return (
        (table.asrsType === criteria.asrsType || table.asrsType === 'All') &&
        this.isWithinCeilingRange(table, criteria.ceilingHeight) &&
        this.isCompatibleCommodity(table, criteria.commodityType)
      );
    });

    return applicableTables[0] || {
      tableNumber: 14, // Default table
      protectionScheme: 'Wet Pipe',
      asrsType: criteria.asrsType,
      commodityTypes: []
    };
  }

  private generateWarnings(figureResult: DecisionMatrixEntry | null, userInput: ASRSInput): string[] {
    const warnings: string[] = [];

    if (!figureResult) {
      warnings.push('No exact figure match found - manual review required');
    }

    if (userInput.ceilingHeight && userInput.ceilingHeight > 30) {
      warnings.push('High ceiling configuration (>30ft) requires special consideration');
    }

    if (userInput.rackDepth > 12) {
      warnings.push('Deep rack configuration may require additional protection measures');
    }

    if (figureResult?.requiresVerticalBarriers) {
      warnings.push('Vertical barriers required between storage levels');
    }

    if (figureResult?.requiresFlueSpaces) {
      warnings.push('Flue spaces required - verify rack configuration allows proper clearances');
    }

    if (userInput.storageHeight && userInput.storageHeight > 25) {
      warnings.push('High storage configuration requires enhanced sprinkler protection');
    }

    return warnings;
  }

  private createSearchKey(asrsType: string, containerType: string, rackDepth: number, rackSpacing: number): string {
    return `${asrsType}_${containerType}_${rackDepth}_${rackSpacing}`;
  }

  private isWithinCeilingRange(table: TableMatrixEntry, ceilingHeight?: number): boolean {
    if (!ceilingHeight) return true;
    if (!table.ceilingHeightMin && !table.ceilingHeightMax) return true;
    if (table.ceilingHeightMin && ceilingHeight < table.ceilingHeightMin) return false;
    if (table.ceilingHeightMax && ceilingHeight > table.ceilingHeightMax) return false;
    return true;
  }

  private isCompatibleCommodity(table: TableMatrixEntry, commodityType?: string): boolean {
    if (!commodityType) return true;
    if (!table.commodityTypes || table.commodityTypes.length === 0) return true;
    return table.commodityTypes.includes(commodityType);
  }

  /**
   * Initialize decision matrix with your actual CSV data
   * This will be populated from your existing FM Global data
   */
  private initializeDecisionMatrix(): Record<string, DecisionMatrixEntry> {
    // TODO: Replace with your actual data from the CSV files
    return {
      'Shuttle_Closed-Top_3_2.5': {
        figureNumber: 4,
        asrsType: 'Shuttle',
        containerType: 'Closed-Top',
        maxDepth: 3,
        maxSpacing: 2.5,
        sprinklerCount: 8,
        sprinklerNumbering: '1-8',
        pageNumber: 32,
        title: 'Horizontal IRAS Arrangement for Closed-Top Combustible Containers, 3ft depth, 2.5ft spacing',
        requiresFlueSpaces: true,
        requiresVerticalBarriers: false
      },
      'Shuttle_Closed-Top_6_2.5': {
        figureNumber: 6,
        asrsType: 'Shuttle',
        containerType: 'Closed-Top',
        maxDepth: 6,
        maxSpacing: 2.5,
        sprinklerCount: 4,
        sprinklerNumbering: '1,3,5,7',
        pageNumber: 32,
        title: 'Horizontal IRAS Arrangement for Closed-Top Combustible Containers, 6ft depth, 2.5ft spacing',
        requiresFlueSpaces: true,
        requiresVerticalBarriers: false
      },
      'Shuttle_Closed-Top_6_5': {
        figureNumber: 7,
        asrsType: 'Shuttle',
        containerType: 'Closed-Top',
        maxDepth: 6,
        maxSpacing: 5,
        sprinklerCount: 4,
        sprinklerNumbering: '1,3,5,7',
        pageNumber: 33,
        title: 'Horizontal IRAS Arrangement for Closed-Top Combustible Containers, 6ft depth, 5ft spacing',
        requiresFlueSpaces: true,
        requiresVerticalBarriers: false
      },
      'Mini-Load_Closed-Top_6_2': {
        figureNumber: 26,
        asrsType: 'Mini-Load',
        containerType: 'Closed-Top',
        maxDepth: 6,
        maxSpacing: 2,
        sprinklerCount: 6,
        sprinklerNumbering: '1,2,3,4,5,6',
        pageNumber: 48,
        title: 'Horizontal IRAS Arrangement for Mini-Load ASRS, 6ft depth, 2ft spacing',
        requiresFlueSpaces: true,
        requiresVerticalBarriers: false
      }
    };
  }

  private initializeTableMatrix(): TableMatrixEntry[] {
    return [
      {
        tableNumber: 14,
        asrsType: 'Shuttle',
        protectionScheme: 'Wet Pipe',
        commodityTypes: ['Class I', 'Class II', 'Class III'],
        ceilingHeightMin: 20,
        ceilingHeightMax: 35,
        storageHeightMax: 30
      },
      {
        tableNumber: 18,
        asrsType: 'Mini-Load',
        protectionScheme: 'Wet Pipe',
        commodityTypes: ['Class I', 'Class II'],
        ceilingHeightMin: 20,
        ceilingHeightMax: 40,
        storageHeightMax: 35
      }
    ];
  }
}

// Create singleton instance
export const asrsEngine = new ASRSDecisionEngine();
