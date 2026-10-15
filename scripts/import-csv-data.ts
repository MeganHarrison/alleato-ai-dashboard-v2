/**
 * Import CSV Data Script
 * Converts your FM Global CSV files into the decision engine format
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface FigureRow {
  figure_number: number;
  asrs_type: string;
  container_type: string;
  max_depth_ft: number;
  max_spacing_ft: number;
  machine_readable_claims: string;
  page_number: number;
  title: string;
}

interface TableRow {
  table_number: number;
  asrs_type: string;
  protection_scheme: string;
  commodity_types: string;
  ceiling_height_min_ft?: number;
  ceiling_height_max_ft?: number;
  storage_height_max_ft?: number;
}

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        let value = values[index] ? values[index].replace(/"/g, '').trim() : '';
        // Try to parse as number
        if (!isNaN(Number(value)) && value !== '') {
          value = parseFloat(value);
        }
        row[header] = value;
      });
      data.push(row);
    }
  }
  
  return data;
}

function convertFiguresData(figuresData: FigureRow[]) {
  const decisionMatrix: Record<string, any> = {};
  let processedCount = 0;

  figuresData.forEach(figure => {
    // Only process design figures (not navigation)
    if (!figure.asrs_type || figure.asrs_type === 'All' || 
        !figure.max_depth_ft || !figure.max_spacing_ft) {
      return;
    }

    const key = \`\${figure.asrs_type}_\${figure.container_type}_\${figure.max_depth_ft}_\${figure.max_spacing_ft}\`;
    
    let claims: any = {};
    try {
      claims = JSON.parse(figure.machine_readable_claims || '{}');
    } catch (e) {
      console.warn(\`Could not parse claims for figure \${figure.figure_number}:\`, e);
    }

    decisionMatrix[key] = {
      figureNumber: figure.figure_number,
      asrsType: figure.asrs_type,
      containerType: figure.container_type,
      maxDepth: figure.max_depth_ft,
      maxSpacing: figure.max_spacing_ft,
      sprinklerCount: claims.sprinkler_count || 0,
      sprinklerNumbering: claims.numbering || '',
      pageNumber: figure.page_number,
      title: figure.title || '',
      requiresFlueSpaces: claims.requires_flue_spaces || false,
      requiresVerticalBarriers: claims.requires_vertical_barriers || false
    };
    
    processedCount++;
  });

  console.log(\`✅ Processed \${processedCount} design figures\`);
  return decisionMatrix;
}

function convertTablesData(tablesData: TableRow[]) {
  const tableMatrix: any[] = [];
  
  tablesData.forEach(table => {
    if (table.table_number) {
      let commodityTypes: string[] = [];
      try {
        commodityTypes = JSON.parse(table.commodity_types || '[]');
      } catch (e) {
        // Handle parsing errors
      }

      tableMatrix.push({
        tableNumber: table.table_number,
        asrsType: table.asrs_type || 'Unknown',
        protectionScheme: table.protection_scheme || 'Unknown',
        commodityTypes: commodityTypes,
        ceilingHeightMin: table.ceiling_height_min_ft || null,
        ceilingHeightMax: table.ceiling_height_max_ft || null,
        storageHeightMax: table.storage_height_max_ft || null
      });
    }
  });

  console.log(\`✅ Processed \${tableMatrix.length} tables\`);
  return tableMatrix;
}

async function main() {
  try {
    console.log('📥 Starting CSV data import...\\n');

    // Define file paths - adjust these to match your CSV file locations
    const dataDir = join(process.cwd(), 'data');
    const figuresPath = join(dataDir, 'fm_global_figures_rows.csv');
    const tablesPath = join(dataDir, 'fm_global_tables_rows.csv');
    
    // Check if CSV files exist
    try {
      const figuresCSV = readFileSync(figuresPath, 'utf8');
      const tablesCSV = readFileSync(tablesPath, 'utf8');
      
      console.log('📖 Reading and parsing CSV files...');
      
      // Parse CSV data
      const figuresData = parseCSV(figuresCSV);
      const tablesData = parseCSV(tablesCSV);
      
      console.log(\`Found \${figuresData.length} figure records\`);
      console.log(\`Found \${tablesData.length} table records\\n\`);
      
      // Convert to decision engine format
      console.log('🔧 Converting to decision engine format...');
      const decisionMatrix = convertFiguresData(figuresData);
      const tableMatrix = convertTablesData(tablesData);
      
      // Generate the complete decision engine code with real data
      console.log('💾 Generating updated decision engine file...');
      
      const engineTemplate = \`/**
 * ASRS Decision Engine - Updated with CSV data
 * Auto-generated on: \${new Date().toISOString()}
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
  private decisionMatrix: Record<string, DecisionMatrixEntry> = \${JSON.stringify(decisionMatrix, null, 4)};
  
  private tableMatrix: TableMatrixEntry[] = \${JSON.stringify(tableMatrix, null, 4)};

  getDesignRequirements(userInput: ASRSInput): ASRSRequirements {
    const { asrsType, containerType, rackDepth, rackSpacing, ceilingHeight, commodityType, storageHeight } = userInput;

    const figureResult = this.findExactFigure({ asrsType, containerType, rackDepth, rackSpacing });
    const tableResult = this.findApplicableTable({ asrsType, commodityType, ceilingHeight, storageHeight });
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

  private findExactFigure(criteria: { asrsType: string; containerType: string; rackDepth: number; rackSpacing: number; }): DecisionMatrixEntry | null {
    const searchKey = this.createSearchKey(criteria.asrsType, criteria.containerType, criteria.rackDepth, criteria.rackSpacing);
    return this.decisionMatrix[searchKey] || this.findClosestFigure(criteria);
  }

  private findClosestFigure(criteria: { asrsType: string; containerType: string; rackDepth: number; rackSpacing: number; }): DecisionMatrixEntry | null {
    const candidates = Object.values(this.decisionMatrix).filter(figure =>
      figure.asrsType === criteria.asrsType && figure.containerType === criteria.containerType
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

  private findApplicableTable(criteria: { asrsType: string; commodityType?: string; ceilingHeight?: number; storageHeight?: number; }): TableMatrixEntry | null {
    const applicableTables = this.tableMatrix.filter(table => {
      return (
        (table.asrsType === criteria.asrsType || table.asrsType === 'All') &&
        this.isWithinCeilingRange(table, criteria.ceilingHeight) &&
        this.isCompatibleCommodity(table, criteria.commodityType)
      );
    });

    return applicableTables[0] || {
      tableNumber: 14,
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
    return \\\`\\\${asrsType}_\\\${containerType}_\\\${rackDepth}_\\\${rackSpacing}\\\`;
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
}

export const asrsEngine = new ASRSDecisionEngine();
\`;

      // Write the updated engine file
      const enginePath = join(process.cwd(), 'lib', 'asrs-decision-engine.ts');
      writeFileSync(enginePath, engineTemplate);
      
      console.log(\`\\n✅ Import completed successfully!\`);
      console.log(\`📊 Decision Matrix: \${Object.keys(decisionMatrix).length} configurations\`);
      console.log(\`📋 Table Matrix: \${tableMatrix.length} tables\`);
      console.log(\`📁 Updated file: lib/asrs-decision-engine.ts\`);
      
      // Show sample configurations
      console.log(\`\\n🔍 Sample configurations available:\`);
      Object.keys(decisionMatrix).slice(0, 5).forEach(key => {
        const config = decisionMatrix[key];
        console.log(\`  • \${key}: Figure \${config.figureNumber} (\${config.sprinklerCount} sprinklers)\`);
      });

    } catch (fileError) {
      console.error(\`❌ Could not read CSV files. Make sure they exist in the data directory:\`);
      console.error(\`  - \${figuresPath}\`);
      console.error(\`  - \${tablesPath}\`);
      console.error(\`\\n💡 Copy your CSV files to the data directory first.\`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();
