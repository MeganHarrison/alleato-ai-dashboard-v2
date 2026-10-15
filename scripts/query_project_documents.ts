import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryDocuments() {
  try {
    // 1. Get total count of documents
    const { count: totalCount, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting documents:', countError);
    } else {
      console.log('\n=== TOTAL DOCUMENTS IN TABLE ===');
      console.log(`Total documents: ${totalCount}`);
    }

    // 2. Get all documents to check their metadata
    const { data: allDocs, error: allError } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching documents:', allError);
      return;
    }

    // 3. Filter for project ID 59
    console.log('\n=== DOCUMENTS FOR PROJECT ID 59 (Tampa Event/Party) ===');
    const project59Docs = allDocs?.filter(doc => {
      if (!doc.metadata) return false;
      
      const metadataStr = typeof doc.metadata === 'string' 
        ? doc.metadata 
        : JSON.stringify(doc.metadata);
      
      // Check various possible ways project_id might be stored
      const metadata = typeof doc.metadata === 'string' 
        ? JSON.parse(doc.metadata) 
        : doc.metadata;
      
      return (metadata as any)?.project_id === 59 ||
             (metadata as any)?.project_id === '59' ||
             metadataStr.includes('Tampa Event') ||
             metadataStr.includes('Tampa Party');
    }) || [];

    if (project59Docs.length > 0) {
      console.log(`Found ${project59Docs.length} documents for project 59:`);
      project59Docs.forEach(doc => {
        console.log(`\n- ID: ${doc.id}`);
        console.log(`  Title: ${doc.title}`);
        console.log(`  Created: ${doc.created_at}`);
        console.log(`  Metadata: ${JSON.stringify(doc.metadata, null, 2)}`);
      });
    } else {
      console.log('No documents found for project ID 59');
    }

    // 4. Show sample metadata structure
    console.log('\n=== SAMPLE METADATA STRUCTURE (first 5 documents) ===');
    const sampleDocs = allDocs?.slice(0, 5) || [];
    sampleDocs.forEach((doc, index) => {
      console.log(`\nDocument ${index + 1}:`);
      console.log(`- ID: ${doc.id}`);
      console.log(`- Title: ${doc.title}`);
      console.log(`- Metadata: ${JSON.stringify(doc.metadata, null, 2)}`);
    });

    // 5. Search for any project-related metadata
    console.log('\n=== ANALYZING PROJECT ASSOCIATIONS ===');
    const projectDocs = allDocs?.filter(doc => {
      if (!doc.metadata) return false;
      const metadataStr = JSON.stringify(doc.metadata);
      return metadataStr.includes('project_id') || 
             metadataStr.includes('project_name') ||
             metadataStr.includes('project');
    }) || [];

    console.log(`\nDocuments with project associations: ${projectDocs.length}`);
    
    // Group by project
    const projectGroups: Record<string, any> = {};
    projectDocs.forEach(doc => {
      const projectId = 'unknown';
      const projectName = 'unknown';
      
      if (doc.metadata) {
        const metadata = typeof doc.metadata === 'string' 
          ? JSON.parse(doc.metadata) 
          : doc.metadata;
        
        if ((metadata as any).project_id) projectId = (metadata as any).project_id;
        if ((metadata as any).project_name) projectName = (metadata as any).project_name;
        if ((metadata as any).project) projectName = (metadata as any).project;
      }
      
      const key = `${projectId}-${projectName}`;
      if (!projectGroups[key]) {
        projectGroups[key] = {
          projectId,
          projectName,
          count: 0,
          documents: []
        };
      }
      projectGroups[key].count++;
      projectGroups[key].documents.push({
        id: doc.id,
        title: doc.title
      });
    });

    console.log('\nProjects found in documents:');
    Object.entries(projectGroups).forEach(([key, group]) => {
      console.log(`\n- Project ID: ${group.projectId}, Name: ${group.projectName}`);
      console.log(`  Document count: ${group.count}`);
      if (group.count <= 3) {
        group.documents.forEach((doc: unknown) => {
          console.log(`    • ${doc.title} (${doc.id})`);
        });
      }
    });

    // 6. Let's also check the projects table to verify project 59 exists
    console.log('\n=== CHECKING PROJECTS TABLE ===');
    const { data: project59, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', 59)
      .single();

    if (projectError) {
      console.log('Error fetching project 59:', projectError.message);
    } else if (project59) {
      console.log('Project 59 details:');
      console.log(JSON.stringify(project59, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

queryDocuments();