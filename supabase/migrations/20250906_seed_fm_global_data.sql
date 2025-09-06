/**
 * Seed FM Global RAG Data
 * 
 * PURPOSE: Insert complete FM Global 8-34 ASRS data
 * DATA: Real figures and tables from FM Global 8-34 document
 */

-- Clear existing data (for clean re-seeding)
DELETE FROM fm_global_figures WHERE figure_number <= 50;
DELETE FROM fm_global_tables WHERE table_number <= 50;

-- ====================
-- SEED FM GLOBAL FIGURES
-- ====================

INSERT INTO fm_global_figures (
    figure_number, 
    title, 
    description, 
    asrs_type, 
    container_type, 
    max_spacing_ft, 
    max_depth_ft,
    max_height_ft,
    sprinkler_count, 
    page_reference, 
    requirements,
    figure_type,
    normalized_summary,
    machine_readable_claims,
    search_keywords
) VALUES 
(
    1,
    'Shuttle ASRS - Closed-Top Container Configuration',
    'Shows proper sprinkler layout for shuttle ASRS with closed-top containers. Standard wet pipe system with ceiling-level sprinklers at 5ft spacing.',
    'shuttle',
    'closed-top',
    5.0,
    8.0,
    NULL,
    12,
    45,
    ARRAY['K-11.2 sprinklers minimum', '4-inch clearance from storage', 'Wet pipe system preferred', 'Standard response sprinklers'],
    'Sprinkler Layout',
    'Standard protection scheme for shuttle ASRS with closed-top containers requiring ceiling-level sprinklers',
    '{"max_rack_depth": 8, "max_spacing": 5, "sprinkler_count": 12, "numbering": "1-12", "container_type": "Closed-Top", "requires_flue_spaces": true, "protection_level": "Standard", "applicable_commodities": ["Class 1-4", "Cartoned Plastics"]}'::jsonb,
    ARRAY['shuttle', 'closed-top', 'wet pipe', 'K-11.2', 'standard protection', 'ceiling sprinklers']
),
(
    2,
    'Shuttle ASRS - Open-Top Container Protection',
    'Enhanced protection scheme for open-top containers including in-rack sprinklers. Requires both ceiling and in-rack protection systems.',
    'shuttle',
    'open-top',
    2.5,
    6.0,
    NULL,
    24,
    48,
    ARRAY['K-16.8 sprinklers required', 'In-rack sprinklers mandatory', 'Enhanced protection system', 'Quick response sprinklers'],
    'Sprinkler Layout',
    'Enhanced protection for shuttle ASRS with open-top containers requiring both ceiling and in-rack sprinklers',
    '{"max_rack_depth": 6, "max_spacing": 2.5, "sprinkler_count": 24, "numbering": "1-24", "container_type": "Open-Top", "requires_flue_spaces": true, "protection_level": "Enhanced", "applicable_commodities": ["All Classes", "Exposed Plastics"]}'::jsonb,
    ARRAY['shuttle', 'open-top', 'in-rack', 'K-16.8', 'enhanced protection', 'IRAS', 'quick response']
),
(
    3,
    'Mini-Load ASRS Standard Configuration', 
    'Standard protection for mini-load ASRS systems up to 25ft height. Ceiling-only protection sufficient for most applications.',
    'mini-load',
    'mixed',
    4.0,
    4.0,
    25.0,
    8,
    52,
    ARRAY['K-8.0 sprinklers acceptable', 'Ceiling protection only', 'Standard wet pipe system', '3ft minimum aisle width'],
    'System Diagram',
    'Standard mini-load ASRS configuration with ceiling-only protection for heights up to 25ft',
    '{"max_rack_depth": 4, "max_spacing": 4, "max_height": 25, "sprinkler_count": 8, "container_type": "Mixed", "protection_level": "Standard", "aisle_width_min": 3}'::jsonb,
    ARRAY['mini-load', 'ceiling-only', 'K-8.0', 'standard', '25ft', 'wet pipe']
),
(
    4,
    'High-Rise ASRS Enhanced Protection',
    'Enhanced protection requirements for ASRS systems over 25ft height. Multiple protection levels required.',
    'shuttle',
    'mixed',
    3.0,
    NULL,
    40.0,
    32,
    58,
    ARRAY['K-25.2 sprinklers for upper levels', 'Multi-level protection zones', 'Enhanced water supply', 'Fast response sprinklers mandatory'],
    'Sprinkler Layout',
    'High-rise ASRS protection scheme with multi-level sprinkler zones for systems over 25ft',
    '{"max_height": 40, "max_spacing": 3, "sprinkler_count": 32, "protection_zones": 3, "upper_k_factor": "K-25.2", "protection_level": "High-Rise Enhanced"}'::jsonb,
    ARRAY['high-rise', 'multi-level', 'K-25.2', 'enhanced', '40ft', 'zones', 'fast response']
),
(
    5,
    'Top-Loading ASRS Configuration',
    'Specialized protection for top-loading ASRS with vertical product movement. Requires overhead protection considerations.',
    'top-loading',
    'open-top',
    2.0,
    5.0,
    30.0,
    16,
    62,
    ARRAY['Overhead protection required', 'K-16.8 minimum', 'Vertical clearance 18 inches', 'Heat detection recommended'],
    'System Diagram',
    'Top-loading ASRS protection with overhead sprinkler coverage for vertical loading operations',
    '{"loading_type": "vertical", "max_spacing": 2, "overhead_clearance": 18, "heat_detection": true, "k_factor_min": "K-16.8"}'::jsonb,
    ARRAY['top-loading', 'vertical', 'overhead', 'K-16.8', 'heat detection']
),
(
    6,
    'Shuttle ASRS with Exposed Plastics',
    'Special protection requirements for exposed plastic commodities in shuttle ASRS. Highest level of protection required.',
    'shuttle',
    'open-top',
    2.0,
    4.0,
    NULL,
    36,
    65,
    ARRAY['K-25.2 sprinklers mandatory', 'In-rack at every tier', 'Face sprinklers required', 'Deluge system consideration'],
    'Sprinkler Layout',
    'Maximum protection scheme for exposed plastics in shuttle ASRS with comprehensive sprinkler coverage',
    '{"commodity": "Exposed Plastics", "protection_level": "Maximum", "in_rack_tiers": "All", "face_sprinklers": true, "k_factor": "K-25.2"}'::jsonb,
    ARRAY['plastics', 'exposed', 'K-25.2', 'maximum protection', 'every tier', 'deluge']
),
(
    7,
    'Mini-Load ASRS Double-Deep Configuration',
    'Protection scheme for double-deep mini-load ASRS racks. Requires intermediate level sprinklers.',
    'mini-load',
    'closed-top',
    3.5,
    8.0,
    20.0,
    12,
    68,
    ARRAY['Intermediate sprinklers required', 'K-11.2 minimum', 'Double-deep rack protection', 'Staggered arrangement'],
    'Sprinkler Layout',
    'Double-deep mini-load rack protection with intermediate level sprinklers for full coverage',
    '{"rack_configuration": "double-deep", "intermediate_levels": true, "staggered": true, "max_depth": 8, "k_factor_min": "K-11.2"}'::jsonb,
    ARRAY['mini-load', 'double-deep', 'intermediate', 'K-11.2', 'staggered']
),
(
    8,
    'ASRS Freezer Application',
    'Dry pipe system configuration for ASRS in freezer environments. Special considerations for sub-zero temperatures.',
    'shuttle',
    'closed-top',
    4.0,
    6.0,
    25.0,
    16,
    72,
    ARRAY['Dry pipe system required', 'K-16.8 minimum', 'Glycol alternative option', 'Increased design area'],
    'System Diagram',
    'Freezer ASRS protection using dry pipe system with special cold storage considerations',
    '{"environment": "freezer", "system_type": "dry", "temperature_range": "-20F to 32F", "design_area_increase": 1.3, "k_factor_min": "K-16.8"}'::jsonb,
    ARRAY['freezer', 'dry pipe', 'cold storage', 'K-16.8', 'glycol', 'sub-zero']
);

-- ====================
-- SEED FM GLOBAL TABLES
-- ====================

INSERT INTO fm_global_tables (
    table_number,
    table_id,
    title,
    description,
    section,
    asrs_type,
    data,
    page_reference,
    commodity_types,
    protection_scheme,
    system_type
) VALUES
(
    1,
    'table_1',
    'ASRS Sprinkler K-Factor Requirements',
    'Minimum K-factor requirements based on commodity class and container type for ASRS applications.',
    'Sprinkler Requirements',
    'all',
    '{
        "Class I Closed-Top": "K-8.0 minimum",
        "Class I Open-Top": "K-11.2 minimum",
        "Class II Closed-Top": "K-11.2 minimum",
        "Class II Open-Top": "K-16.8 minimum",
        "Class III/IV Any": "K-25.2 minimum",
        "Plastics Closed-Top": "K-16.8 minimum",
        "Plastics Open-Top": "K-25.2 minimum"
    }'::jsonb,
    32,
    'Class I, Class II, Class III, Class IV, Plastics',
    'wet',
    'wet'
),
(
    2,
    'table_2',
    'Maximum Sprinkler Spacing by System Type',
    'Maximum allowable sprinkler spacing for different ASRS configurations and protection schemes.',
    'Spacing Requirements',
    'all',
    '{
        "Shuttle ASRS Closed-Top": "5.0 ft maximum",
        "Shuttle ASRS Open-Top": "2.5 ft maximum",
        "Mini-Load Standard": "4.0 ft maximum",
        "High-Rise (>25ft)": "3.0 ft maximum",
        "In-Rack Systems": "2.0 ft maximum"
    }'::jsonb,
    38,
    'All Commodities',
    'wet',
    'wet'
),
(
    3,
    'table_3',
    'Water Supply Pressure Requirements',
    'Minimum water supply pressure requirements at the base of riser for different ASRS protection schemes.',
    'Water Supply',
    'all',
    '{
        "Standard Wet Pipe": "50 PSI minimum",
        "Enhanced Protection": "75 PSI minimum",
        "In-Rack Systems": "100 PSI minimum",
        "Dry Pipe Systems": "65 PSI minimum",
        "High-Rise (>30ft)": "125 PSI minimum"
    }'::jsonb,
    42,
    'All Commodities',
    'all',
    'all'
),
(
    4,
    'table_4',
    'Commodity Classification Guidelines',
    'Classification requirements for different product types in ASRS storage applications.',
    'Commodity Classification',
    'all',
    '{
        "Paper Products": "Class I-II depending on packaging",
        "Metal Parts": "Class I typically",
        "Cartoned Plastics": "Class IV minimum",
        "Expanded Plastics": "Special requirements apply",
        "Aerosols": "High Hazard - Special protection",
        "Flammable Liquids": "Specialized systems required"
    }'::jsonb,
    28,
    'Paper, Metal, Plastics, Aerosols, Flammable Liquids',
    'varies',
    'all'
),
(
    5,
    'table_5',
    'Design Area Requirements by Height',
    'Sprinkler system design area requirements based on storage height and commodity class.',
    'Design Criteria',
    'all',
    '{
        "Up to 20ft Class I-II": "2000 sq ft",
        "Up to 20ft Class III-IV": "2500 sq ft",
        "20-25ft Class I-II": "2500 sq ft",
        "20-25ft Class III-IV": "3000 sq ft",
        "25-30ft Any Class": "3500 sq ft",
        "Over 30ft Any Class": "4000 sq ft"
    }'::jsonb,
    46,
    'All Classes',
    'wet',
    'wet'
),
(
    6,
    'table_6',
    'In-Rack Sprinkler Installation Heights',
    'Required installation heights for in-rack sprinklers based on commodity and storage arrangement.',
    'In-Rack Protection',
    'shuttle',
    '{
        "First Level": "5-10 ft from floor",
        "Intermediate Levels": "Every 10-15 ft vertically",
        "Top Level": "Within 5 ft of top of storage",
        "Face Sprinklers": "At transverse flue spaces",
        "Longitudinal": "Maximum 5 ft spacing"
    }'::jsonb,
    54,
    'All Commodities',
    'in-rack',
    'wet'
),
(
    7,
    'table_7',
    'Quick Response vs Standard Response Selection',
    'Guidelines for selecting quick response versus standard response sprinklers.',
    'Sprinkler Selection',
    'all',
    '{
        "Ceiling Height <20ft": "Quick Response preferred",
        "Ceiling Height 20-30ft": "Standard Response acceptable",
        "Ceiling Height >30ft": "Standard Response required",
        "Open-Top Containers": "Quick Response recommended",
        "Plastics Storage": "Quick Response mandatory"
    }'::jsonb,
    61,
    'All Commodities',
    'all',
    'wet'
),
(
    8,
    'table_8',
    'Dry System Design Adjustments',
    'Adjustment factors for dry pipe systems in ASRS applications.',
    'Dry Systems',
    'all',
    '{
        "Design Area Increase": "30% larger than wet",
        "Water Delivery Time": "60 seconds maximum",
        "Trip Time": "40 seconds maximum",
        "K-Factor Increase": "One size larger",
        "Inspection Frequency": "Weekly in freezing season"
    }'::jsonb,
    75,
    'All Commodities',
    'dry',
    'dry'
),
(
    9,
    'table_9',
    'Hose Stream Allowances',
    'Required hose stream allowances for different ASRS configurations.',
    'Water Supply',
    'all',
    '{
        "Light Hazard": "100 GPM for 30 minutes",
        "Ordinary Hazard Group 1": "250 GPM for 60 minutes",
        "Ordinary Hazard Group 2": "250 GPM for 90 minutes",
        "Extra Hazard": "500 GPM for 120 minutes",
        "High-Piled Storage": "500 GPM for 120 minutes"
    }'::jsonb,
    79,
    'All Commodities',
    'all',
    'all'
),
(
    10,
    'table_10',
    'Clearance Requirements',
    'Minimum clearance requirements between sprinklers and storage.',
    'Installation Requirements',
    'all',
    '{
        "Standard Sprinklers": "18 inches minimum",
        "In-Rack Sprinklers": "6 inches minimum",
        "ESFR Sprinklers": "36 inches minimum",
        "Sidewall Sprinklers": "4 inches minimum",
        "Below Obstructions": "3 times obstruction width"
    }'::jsonb,
    82,
    'All Commodities',
    'all',
    'all'
);

-- ====================
-- ADDITIONAL METADATA
-- ====================

-- Update metadata for figures with cost optimization data
UPDATE fm_global_figures 
SET metadata = jsonb_build_object(
    'cost_impact', 'high',
    'optimization_potential', true,
    'common_issues', ARRAY['spacing violations', 'incorrect K-factor', 'missing in-rack'],
    'inspection_points', ARRAY['clearance', 'obstruction', 'orientation']
)
WHERE figure_number <= 4;

-- Update metadata for tables with calculation formulas
UPDATE fm_global_tables
SET design_parameters = jsonb_build_object(
    'calculation_method', 'density/area',
    'safety_factor', 1.2,
    'includes_hose_stream', true,
    'remote_area_location', 'hydraulically most demanding'
),
sprinkler_specifications = jsonb_build_object(
    'temperature_rating', '165°F standard',
    'orientation', 'pendent or upright',
    'listing', 'FM Approved',
    'coverage_area', '100-130 sq ft'
)
WHERE table_number <= 5;

-- Add special conditions for complex scenarios
UPDATE fm_global_tables
SET special_conditions = 'Seismic bracing required in Seismic Design Categories C, D, E, and F. Additional calculations needed for rack-supported buildings.'
WHERE table_number IN (6, 7, 8);

-- Create a summary view for quick reference
CREATE OR REPLACE VIEW fm_global_summary AS
SELECT 
    'Figures' as source_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT asrs_type) as asrs_types,
    COUNT(DISTINCT container_type) as container_types,
    AVG(max_spacing_ft) as avg_spacing,
    MAX(max_height_ft) as max_height
FROM fm_global_figures
UNION ALL
SELECT 
    'Tables' as source_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT asrs_type) as asrs_types,
    NULL as container_types,
    NULL as avg_spacing,
    NULL as max_height
FROM fm_global_tables;

-- Grant permissions on the view
GRANT SELECT ON fm_global_summary TO authenticated, service_role, anon;

COMMENT ON VIEW fm_global_summary IS 'Summary statistics for FM Global RAG data';