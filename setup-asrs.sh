#!/bin/bash

# ASRS Decision Engine Setup Script
# Run this from your alleato-ai-dashboard directory

echo "🚀 Setting up ASRS Decision Engine..."
echo

# Step 1: Copy CSV files
echo "📋 Step 1: Copy your CSV files to the data directory"
echo "You need to manually copy these files:"
echo "  • fm_global_figures_rows.csv → data/fm_global_figures_rows.csv"
echo "  • fm_global_tables_rows.csv → data/fm_global_tables_rows.csv"
echo
echo "Press Enter when you've copied the files..."
read

# Step 2: Run the import script
echo "📥 Step 2: Running CSV import script..."
npx tsx scripts/import-csv-data.ts

# Step 3: Start development server
echo
echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Visit: http://localhost:3000/asrs-requirements-calculator"
echo "3. Test the calculator with different ASRS configurations"
echo
echo "API endpoint available at:"
echo "POST /api/asrs/design-requirements"
echo "GET  /api/asrs/design-requirements (for configurations)"
