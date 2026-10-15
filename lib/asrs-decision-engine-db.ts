/**
 * ASRS Decision Engine - Database Integration
 * Uses your existing Supabase tables for deterministic lookups
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export class ASRSDecisionEngine {
  /**
   * Main method: Get exact design requirements from database
   */
  async getDesignRequirements(userInput: ASRSInput): Promise<ASRSRequirements> {
    const {
      asrsType,
      containerType,
      rackDepth,
      rackSpacing,
      ceilingHeight,
      commodityType,
      storageHeight
    } = userInput;

    try {
      // Step 1: Find exact configuration match from database
      const configResult = await this.findExactConfiguration({
        asrsType,
        containerType,
        rackDepth,
        rackSpacing
      });

      // Step 2: Find applicable table from database
      const tableResult = await this.findApplicableTable({
        asrsType,
        commodityType,
        ceilingHeight,
        storageHeight
      });

      // Step 3: Generate warnings
      const warnings = this.generateWarnings(configResult, userInput);

      return {
        compliance: {
          applicableFigure: configResult?.applicable_figure || null,
          applicableTable: configResult?.applicable_table || null,
          pageReference: configResult?.page_reference || null,
          isCompliant: !!(configResult && tableResult),
          figureTitle: configResult?.figure_title || null
        },
        specifications: {
          sprinklerCount: configResult?.sprinkler_count || 0,
          sprinklerNumbering: configResult?.sprinkler_numbering || '',
          spacing: configResult?.rack_spacing_ft || null,
          rackDepth: configResult?.rack_depth_ft || null,
          protectionScheme: tableResult?.protection_scheme || 'Wet Pipe',
          flueSpacesRequired: configResult?.requires_flue_spaces || false,
          verticalBarriersRequired: configResult?.requires_vertical_barriers || false
        },
        warnings,
        metadata: {
          searchKey: this.createSearchKey(asrsType, containerType, rackDepth, rackSpacing),
          matchType: configResult ? 'exact' : 'none',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Database error in getDesignRequirements:', error);
      throw new Error('Failed to retrieve ASRS requirements from database');
    }
  }

  /**
   * Get available configuration options from database
   */
  async getAvailableConfigurations() {
    try {
      const { data: configs, error } = await supabase
        .from('fm_global_figures')
        .select('asrs_type, container_type, max_depth_ft, max_spacing_ft')
        .not('asrs_type', 'eq', 'All')
        .not('max_depth_ft', 'is', null)
        .not('max_spacing_ft', 'is', null);

      if (error) {
        console.error('Database error in getAvailableConfigurations:', error);
        throw error;
      }

      const asrsTypes = [...new Set(configs?.map(c => c.asrs_type) || [])];
      const containerTypes = [...new Set(configs?.map(c => c.container_type) || [])];
      const availableDepths = [...new Set(configs?.map(c => c.max_depth_ft) || [])].sort((a, b) => a - b);
      const availableSpacings = [...new Set(configs?.map(c => c.max_spacing_ft) || [])].sort((a, b) => a - b);

      console.log('Available configurations loaded:', {
        asrsTypes,
        containerTypes,
        availableDepths,
        availableSpacings
      });

      return {
        asrsTypes,
        containerTypes,
        availableDepths,
        availableSpacings,
        commodityTypes: ['Class I', 'Class II', 'Class III', 'Class IV']
      };
    } catch (error) {
      console.error('Database error in getAvailableConfigurations:', error);
      return {
        asrsTypes: ['Shuttle', 'Mini-Load'],
        containerTypes: ['Closed-Top', 'Open-Top'],
        availableDepths: [3, 6, 9, 14],
        availableSpacings: [2, 2.5, 5, 8],
        commodityTypes: ['Class I', 'Class II', 'Class III', 'Class IV']
      };
    }
  }

  /**
   * Find exact configuration match from fm_global_figures table
   */
  private async findExactConfiguration(criteria: {
    asrsType: string;
    containerType: string;
    rackDepth: number;
    rackSpacing: number;
  }) {
    console.log('Searching for configuration:', criteria);
    
    const { data, error } = await supabase
      .from('fm_global_figures')
      .select('*')
      .eq('asrs_type', criteria.asrsType)
      .eq('container_type', criteria.containerType)
      .eq('max_depth_ft', parseFloat(criteria.rackDepth.toString()))
      .eq('max_spacing_ft', parseFloat(criteria.rackSpacing.toString()))
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error in findExactConfiguration:', error);
    }

    if (data) {
      console.log('Found exact match:', data.figure_number);
      // Parse machine readable claims
      let claims = {};
      try {
        claims = typeof data.machine_readable_claims === 'string' 
          ? JSON.parse(data.machine_readable_claims) 
          : data.machine_readable_claims || {};
      } catch (e) {
        console.warn('Could not parse machine_readable_claims:', e);
      }
      
      // Return in the format expected by the rest of the code
      return {
        applicable_figure: data.figure_number,
        applicable_table: 14, // Default - could be enhanced
        sprinkler_count: claims.sprinkler_count || 0,
        sprinkler_numbering: claims.numbering || '',
        rack_spacing_ft: data.max_spacing_ft,
        rack_depth_ft: data.max_depth_ft,
        requires_flue_spaces: claims.requires_flue_spaces || false,
        requires_vertical_barriers: claims.requires_vertical_barriers || false,
        page_reference: data.page_number,
        figure_title: data.title
      };
    }

    console.log('No exact match found, searching for closest...');
    // If no exact match, find closest configuration
    return this.findClosestConfiguration(criteria);
  }

  /**
   * Find closest configuration when exact match isn't available
   */
  private async findClosestConfiguration(criteria: {
    asrsType: string;
    containerType: string;
    rackDepth: number;
    rackSpacing: number;
  }) {
    const { data, error } = await supabase
      .from('fm_global_figures')
      .select('*')
      .eq('asrs_type', criteria.asrsType)
      .eq('container_type', criteria.containerType)
      .not('max_depth_ft', 'is', null)
      .not('max_spacing_ft', 'is', null);

    if (error) {
      console.error('Database error in findClosestConfiguration:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('No configurations found for:', criteria.asrsType, criteria.containerType);
      return null;
    }

    console.log('Found', data.length, 'potential matches, finding closest...');

    // Find closest match by depth, then by spacing
    const closest = data.reduce((best, current) => {
      const currentDepthDiff = Math.abs(parseFloat(current.max_depth_ft) - parseFloat(criteria.rackDepth));
      const bestDepthDiff = best ? Math.abs(parseFloat(best.max_depth_ft) - parseFloat(criteria.rackDepth)) : Infinity;
      
      if (currentDepthDiff < bestDepthDiff) {
        return current;
      } else if (currentDepthDiff === bestDepthDiff) {
        const currentSpacingDiff = Math.abs(parseFloat(current.max_spacing_ft) - parseFloat(criteria.rackSpacing));
        const bestSpacingDiff = Math.abs(parseFloat(best.max_spacing_ft) - parseFloat(criteria.rackSpacing));
        return currentSpacingDiff < bestSpacingDiff ? current : best;
      }
      
      return best;
    }, null);

    if (closest) {
      console.log('Found closest match:', closest.figure_number);
      
      // Parse machine readable claims
      let claims = {};
      try {
        claims = typeof closest.machine_readable_claims === 'string' 
          ? JSON.parse(closest.machine_readable_claims) 
          : closest.machine_readable_claims || {};
      } catch (e) {
        console.warn('Could not parse machine_readable_claims:', e);
      }
      
      return {
        applicable_figure: closest.figure_number,
        applicable_table: 14,
        sprinkler_count: claims.sprinkler_count || 0,
        sprinkler_numbering: claims.numbering || '',
        rack_spacing_ft: closest.max_spacing_ft,
        rack_depth_ft: closest.max_depth_ft,
        requires_flue_spaces: claims.requires_flue_spaces || false,
        requires_vertical_barriers: claims.requires_vertical_barriers || false,
        page_reference: closest.page_number,
        figure_title: closest.title
      };
    }

    return null;
  }

  /**
   * Find applicable table from fm_global_tables
   */
  private async findApplicableTable(criteria: {
    asrsType: string;
    commodityType?: string;
    ceilingHeight?: number;
    storageHeight?: number;
  }) {
    let query = supabase
      .from('fm_global_tables')
      .select('*');

    // Filter by ASRS type
    if (criteria.asrsType) {
      query = query.or(`asrs_type.eq.${criteria.asrsType},asrs_type.eq.All`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error in findApplicableTable:', error);
      return {
        table_number: 14,
        protection_scheme: 'Wet Pipe',
        asrs_type: criteria.asrsType
      };
    }

    // Return first applicable table or default
    return data?.[0] || {
      table_number: 14,
      protection_scheme: 'Wet Pipe',
      asrs_type: criteria.asrsType
    };
  }

  private generateWarnings(configResult: any, userInput: ASRSInput): string[] {
    const warnings: string[] = [];

    if (!configResult) {
      warnings.push('No exact configuration match found - manual review required');
    }

    if (userInput.ceilingHeight && userInput.ceilingHeight > 30) {
      warnings.push('High ceiling configuration (>30ft) requires special consideration');
    }

    if (userInput.rackDepth > 12) {
      warnings.push('Deep rack configuration may require additional protection measures');
    }

    if (configResult?.requires_vertical_barriers) {
      warnings.push('Vertical barriers required between storage levels');
    }

    if (configResult?.requires_flue_spaces) {
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
}

// Create singleton instance
export const asrsEngine = new ASRSDecisionEngine();
