# FM Global Form Implementation Plan

## Overview
Transform the current basic form into a comprehensive FM Global 8-34 compliance tool that accurately determines sprinkler requirements and generates cost estimates based on actual FM Global rules.

## Phase 1: Enhanced Data Collection (Week 1)

### 1.1 Expand Form Fields
Add these critical missing fields to the form:

```typescript
interface EnhancedASRSFormData extends ASRSFormData {
  // Container Details
  container_material: 'noncombustible' | 'combustible_cellulosic' | 'unexpanded_plastic';
  container_walls: 'solid' | 'non_solid';
  container_bottom: 'solid' | 'gridded';
  
  // Rack Structure
  rack_upright_spacing_in: number; // 18-24 inches typical
  transverse_flue_space_in: number; // min 3 inches
  longitudinal_flue_space_in: number; // 3-24 inches
  tier_height_in: number; // 9-18 inches for HL-ASRS
  number_of_tiers: number;
  
  // Environmental
  ambient_temperature: 'freezer' | 'cooler' | 'ambient';
  seismic_zone: 'low' | 'moderate' | 'high';
  water_supply_pressure_psi: number;
  water_supply_flow_gpm: number;
  
  // Overall Dimensions
  storage_length_ft: number;
  storage_width_ft: number;
  // storage_height_ft already exists
}
```

### 1.2 Progressive Disclosure
Implement conditional logic to show fields based on previous answers:
- If `container_type = 'Open-Top'` → Show in-rack sprinkler configuration
- If `ambient_temperature = 'freezer'` → Show dry system options
- If `rack_depth_ft > 6` → Show enhanced protection requirements

## Phase 2: FM Global Logic Engine (Week 2)

### 2.1 Create Decision Trees
Build rule engine based on FM Global 8-34:

```typescript
// Example decision logic
function determineProtectionScheme(data: EnhancedASRSFormData) {
  // Ceiling-only allowed conditions
  if (data.container_material === 'noncombustible' && 
      data.container_type === 'Closed-Top' &&
      data.storage_height_ft <= 20) {
    return 'ceiling-only';
  }
  
  // In-rack required conditions
  if (data.container_type === 'Open-Top' ||
      data.commodity_type.includes('Uncartoned Plastics') ||
      data.storage_height_ft > 25) {
    return 'ceiling-plus-in-rack';
  }
  
  // Standard protection
  return 'standard-ceiling';
}
```

### 2.2 Figure/Table Lookup System
Create mapping of conditions to FM Global figures/tables:

```typescript
const FIGURE_LOOKUP = {
  'shuttle_closed_3ft': ['Figure 12', 'Figure 13'],
  'shuttle_open_6ft': ['Figure 18', 'Figure 19'],
  'miniload_closed_3ft': ['Figure 26', 'Figure 27'],
  // ... complete mapping
};

const TABLE_LOOKUP = {
  'wet_ceiling_class1-4': 'Table 8',
  'dry_ceiling_plastics': 'Table 12',
  'in_rack_spacing': 'Table 15',
  // ... complete mapping
};
```

## Phase 3: Cost Calculation Engine (Week 3)

### 3.1 Accurate Sprinkler Count
Calculate based on actual FM Global spacing requirements:

```typescript
function calculateSprinklerCount(data: EnhancedASRSFormData) {
  const area = data.storage_length_ft * data.storage_width_ft;
  
  // Ceiling sprinklers
  let ceilingSprinklerSpacing = 100; // sq ft, default
  if (data.commodity_type.includes('Plastics')) {
    ceilingSprinklerSpacing = 80; // Reduced for plastics
  }
  const ceilingSprinklers = Math.ceil(area / ceilingSprinklerSpacing);
  
  // In-rack sprinklers (if required)
  let inRackSprinklers = 0;
  if (needsInRackProtection(data)) {
    const racksPerLevel = Math.ceil(data.storage_length_ft / data.rack_spacing_ft);
    const levelsRequiringProtection = Math.floor(data.storage_height_ft / 10);
    inRackSprinklers = racksPerLevel * levelsRequiringProtection * 2; // Face sprinklers
  }
  
  return {
    ceiling: ceilingSprinklers,
    inRack: inRackSprinklers,
    total: ceilingSprinklers + inRackSprinklers
  };
}
```

### 3.2 Regional Cost Adjustments
Add location-based pricing:

```typescript
const REGIONAL_MULTIPLIERS = {
  'northeast': 1.25,
  'west_coast': 1.30,
  'midwest': 1.0,
  'south': 0.95,
  'mountain': 1.05
};

const BASE_COSTS = {
  sprinkler_unit: 75,
  piping_per_ft: 12,
  labor_per_hour: 85,
  k_factor_multipliers: {
    'K11.2': 1.0,
    'K16.8': 1.15,
    'K25.2': 1.35
  }
};
```

## Phase 4: API Implementation (Week 1-2)

### 4.1 Create New Form API Route

```typescript
// app/api/fm-global-design/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.json();
  
  // Validate input
  const validation = validateASRSInput(formData);
  if (!validation.valid) {
    return NextResponse.json({ 
      success: false, 
      errors: validation.errors 
    }, { status: 400 });
  }
  
  // Determine protection scheme
  const protectionScheme = determineProtectionScheme(formData);
  
  // Look up applicable figures/tables
  const figures = lookupFigures(formData);
  const tables = lookupTables(formData);
  
  // Calculate sprinkler requirements
  const sprinklerCalc = calculateSprinklerCount(formData);
  
  // Generate cost estimate
  const costEstimate = calculateCosts(formData, sprinklerCalc);
  
  // Check for optimization opportunities
  const optimizations = findOptimizations(formData);
  
  return NextResponse.json({
    success: true,
    specification: {
      protectionScheme,
      applicableFigures: figures,
      applicableTables: tables,
      sprinklerCount: sprinklerCalc.total,
      inRackProtection: {
        required: sprinklerCalc.inRack > 0,
        count: sprinklerCalc.inRack
      },
      costEstimate,
      optimizations
    },
    submissionId: generateSubmissionId()
  });
}
```

### 4.2 Optimization Suggestions
Automatically identify cost-saving opportunities:

```typescript
function findOptimizations(data: EnhancedASRSFormData) {
  const suggestions = [];
  
  // Container optimization
  if (data.container_type === 'Open-Top') {
    suggestions.push({
      type: 'container_change',
      description: 'Switch to closed-top containers',
      potential_savings: calculateContainerSavings(data),
      impact: 'Eliminate in-rack sprinklers'
    });
  }
  
  // Height optimization
  if (data.storage_height_ft > 20 && data.storage_height_ft <= 22) {
    suggestions.push({
      type: 'height_reduction',
      description: 'Reduce storage height to ≤20 ft',
      potential_savings: calculateHeightSavings(data),
      impact: 'Avoid enhanced protection requirements'
    });
  }
  
  // Spacing optimization
  if (data.rack_spacing_ft < 5) {
    suggestions.push({
      type: 'spacing_increase',
      description: 'Increase aisle width to ≥5 ft',
      potential_savings: calculateSpacingSavings(data),
      impact: 'Reduce sprinkler density requirements'
    });
  }
  
  return suggestions;
}
```

## Phase 5: Validation & Compliance (Week 3)

### 5.1 Compliance Checks
Implement FM Global requirement validation:

```typescript
function validateCompliance(data: EnhancedASRSFormData) {
  const violations = [];
  
  // Minimum clearances
  const clearance = data.ceiling_height_ft - data.storage_height_ft;
  if (clearance < 3) {
    violations.push({
      code: 'CLEARANCE_VIOLATION',
      message: 'Minimum 3 ft clearance required between storage and ceiling sprinklers',
      reference: 'FM Global 8-34, Section 2.2.1'
    });
  }
  
  // Water delivery time
  if (data.system_type === 'dry' && !data.quickResponseSprinklers) {
    violations.push({
      code: 'DELIVERY_TIME',
      message: 'Dry systems require water delivery within 40 seconds',
      reference: 'FM Global 8-34, Section 3.3.2'
    });
  }
  
  return violations;
}
```

### 5.2 Report Generation
Create downloadable compliance report:

```typescript
function generateComplianceReport(data, specification) {
  return {
    projectInfo: {
      date: new Date().toISOString(),
      facility: data.facilityName,
      asrsType: data.asrs_type
    },
    designSpecification: {
      ...specification,
      complianceStatus: 'FM Global 8-34 Compliant',
      designBasis: 'FM Global Property Loss Prevention Data Sheet 8-34'
    },
    calculations: {
      hydraulicDesign: calculateHydraulics(data),
      waterDemand: calculateWaterDemand(data)
    },
    costBreakdown: specification.costEstimate,
    optimizationOpportunities: specification.optimizations,
    installationGuidelines: getInstallationSteps(specification),
    testingRequirements: getTestingProcedures(specification)
  };
}
```

## Implementation Timeline

### Week 1
- [ ] Enhance form with missing fields
- [ ] Implement progressive disclosure logic
- [ ] Create basic API route structure

### Week 2  
- [ ] Build FM Global decision engine
- [ ] Implement figure/table lookup system
- [ ] Create sprinkler calculation logic

### Week 3
- [ ] Develop cost calculation engine
- [ ] Add optimization suggestions
- [ ] Implement compliance validation

### Week 4
- [ ] Testing with known designs
- [ ] Validation against FM Global requirements
- [ ] User acceptance testing

## Testing Strategy

### Unit Tests
- Decision tree logic
- Sprinkler calculations
- Cost estimations
- Compliance validations

### Integration Tests
- Form submission flow
- API response validation
- Report generation

### Validation Tests
- Test against 10+ known ASRS designs
- Verify FM Global compliance
- Compare with manual calculations

## Success Metrics

1. **Accuracy**: 95%+ match with manual FM Global calculations
2. **Speed**: < 2 seconds to generate design
3. **Completeness**: Covers 90%+ of standard ASRS configurations
4. **Optimization**: Identifies average 15-20% cost savings
5. **User Satisfaction**: 4.5+ star rating

## Next Steps

1. **Immediate**: Fix the missing API route
2. **Priority 1**: Add missing critical form fields
3. **Priority 2**: Implement basic decision logic
4. **Priority 3**: Add cost calculations
5. **Future**: Build visual design tool with 3D visualization

This implementation will transform the basic form into a powerful FM Global compliance tool that provides real value to users by accurately determining requirements and identifying cost optimizations.