import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check authorization - only allow internal calls or API key
    const authHeader = request.headers.get('authorization');
    const validApiKey = process.env.CRON_SECRET_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${validApiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Auto-Sync] Starting automatic Fireflies sync...');
    
    // Get last sync timestamp
    const { data: lastSyncData } = await supabase
      .from('archon_settings')
      .select('value, updated_at')
      .eq('key', 'fireflies_last_sync')
      .single();

    const lastSync = lastSyncData?.value ? new Date(lastSyncData.value) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago
    
    console.log(`[Auto-Sync] Last sync: ${lastSync.toISOString()}`);

    // Call the existing sync endpoint
    const syncResponse = await fetch(`${request.nextUrl.origin}/api/fireflies/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 50, // Sync up to 50 recent transcripts
        startDate: lastSync.toISOString().split('T')[0], // Since last sync
        autoSync: true
      })
    });

    const syncResult = await syncResponse.json();
    
    if (!syncResponse.ok) {
      throw new Error(syncResult.error || 'Sync failed');
    }

    // Update last sync timestamp
    const now = new Date().toISOString();
    await supabase
      .from('archon_settings')
      .upsert({
        key: 'fireflies_last_sync',
        value: now,
        category: 'sync',
        description: 'Timestamp of last Fireflies auto-sync',
        updated_at: now
      });

    console.log(`[Auto-Sync] Completed successfully. Synced ${syncResult.transcriptsProcessed || 0} transcripts`);

    return NextResponse.json({
      success: true,
      message: 'Auto-sync completed successfully',
      transcriptsProcessed: syncResult.transcriptsProcessed || 0,
      lastSync: lastSync.toISOString(),
      currentSync: now,
      details: syncResult
    });

  } catch (error) {
    console.error('[Auto-Sync] Error:', error);
    
    // Log error to settings table for monitoring
    await supabase
      .from('archon_settings')
      .upsert({
        key: 'fireflies_last_sync_error',
        value: error instanceof Error ? error.message : 'Unknown error',
        category: 'sync',
        description: 'Last auto-sync error',
        updated_at: new Date().toISOString()
      });

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Auto-sync failed' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check auto-sync status
export async function GET() {
  try {
    const { data: settings } = await supabase
      .from('archon_settings')
      .select('key, value, updated_at')
      .in('key', ['fireflies_last_sync', 'fireflies_last_sync_error'])
      .order('updated_at', { ascending: false });

    const lastSync = settings?.find(s => s.key === 'fireflies_last_sync');
    const lastError = settings?.find(s => s.key === 'fireflies_last_sync_error');

    return NextResponse.json({
      success: true,
      lastSync: lastSync?.value || null,
      lastSyncTime: lastSync?.updated_at || null,
      lastError: lastError?.value || null,
      lastErrorTime: lastError?.updated_at || null,
      status: lastSync ? 'active' : 'never_run'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sync status' 
      },
      { status: 500 }
    );
  }
}