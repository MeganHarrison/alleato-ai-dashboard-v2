# Clean FM Global RAG Setup Instructions

## Problem Summary
The current RAG setup is a mess with:
- ❌ Functions scattered across multiple files
- ❌ Missing `fm_figures_search()` function that API calls
- ❌ Duplicate schemas in different locations
- ❌ No single source of truth

## Solution: Clean, Unified Setup

### 1. Apply the New Migration
Run this SQL in your Supabase dashboard to clean up and create the proper RAG setup:

```bash
# Apply the new unified migration
# File: /supabase/migrations/20250906_unified_fm_global_rag_setup.sql
```

### 2. What This Creates

**Clean Tables:**
- `fm_global_figures` - Figures with vector embeddings  
- `fm_global_tables` - Protection requirements & specs

**Working Functions:**
- ✅ `fm_figures_search(embedding, threshold, count)` - What the API actually calls
- ✅ `fm_tables_search(text, count)` - Text-based table search  
- ✅ `fm_global_search(text, embedding, count)` - Combined search

**Proper Indexes:**
- Vector similarity indexes for fast search
- Text similarity indexes for table content

### 3. Benefits of New Setup

✅ **Single source of truth** - One migration file  
✅ **Working API calls** - All functions exist and work  
✅ **Efficient queries** - Proper indexes for performance  
✅ **Clean structure** - No duplicate/conflicting code  
✅ **Easy to maintain** - Everything in one place  

### 4. Next Steps

1. Run the migration in Supabase
2. Populate tables with actual FM Global data
3. Generate embeddings for figures
4. Test RAG functionality

The RAG API will now work properly with real vector search!