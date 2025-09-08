import { createClient } from '@/lib/supabase/server';

export default async function TestInsightsPage() {
  const supabase = await createClient();
  
  // Simple query without joins
  const { data: insights, error, count } = await supabase
    .from('ai_insights')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Insights Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-lg">Total insights in database: <strong>{count || 0}</strong></p>
        <p className="text-lg">Fetched insights: <strong>{insights?.length || 0}</strong></p>
      </div>
      
      {insights && insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sample Insights:</h2>
          {insights.map((insight) => (
            <div key={insight.id} className="border p-4 rounded">
              <h3 className="font-bold">{insight.title}</h3>
              <p className="text-sm text-gray-600">Type: {insight.insight_type}</p>
              <p className="text-sm">
                Description: {
                  typeof insight.description === 'string' && insight.description.startsWith('{')
                    ? 'JSON data'
                    : insight.description
                }
              </p>
              <p className="text-xs text-gray-500">Created: {new Date(insight.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}