#!/usr/bin/env node

/**
 * Fireflies Auto-Sync Scheduler
 * 
 * This script runs every 30 minutes to automatically sync Fireflies transcripts.
 * It can be set up as a cron job or run as a continuous background service.
 * 
 * Setup as cron job (every 30 minutes):
 * */30 * * * * cd /path/to/project && node scripts/auto-sync-scheduler.js
 * 
 * Or run as daemon:
 * npm run auto-sync:daemon
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

class AutoSyncScheduler {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.apiKey = process.env.CRON_SECRET_KEY;
    this.isDaemon = process.argv.includes('--daemon');
    this.interval = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  async makeRequest(endpoint, method = 'POST', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'AutoSyncScheduler/1.0'
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = lib.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsedData.error || 'Request failed'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async runSync() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting Fireflies auto-sync...`);

    try {
      // Check if API key is configured
      if (!this.apiKey) {
        throw new Error('CRON_SECRET_KEY environment variable not configured');
      }

      // Execute auto-sync
      const result = await this.makeRequest('/api/fireflies/auto-sync', 'POST');
      
      const endTimestamp = new Date().toISOString();
      console.log(`[${endTimestamp}] Sync completed successfully:`);
      console.log(`  - Transcripts processed: ${result.transcriptsProcessed || 0}`);
      console.log(`  - Last sync: ${result.lastSync}`);
      console.log(`  - Current sync: ${result.currentSync}`);

      return { success: true, result };

    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] Auto-sync failed:`, error.message);
      
      // Try to get sync status for diagnostics
      try {
        const status = await this.makeRequest('/api/fireflies/auto-sync', 'GET');
        console.log('Current sync status:', status);
      } catch (statusError) {
        console.error('Failed to get sync status:', statusError.message);
      }

      return { success: false, error: error.message };
    }
  }

  async runDaemon() {
    console.log(`Starting Fireflies auto-sync daemon (every ${this.interval / 60000} minutes)...`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`API Key configured: ${!!this.apiKey}`);

    // Run initial sync
    await this.runSync();

    // Set up recurring sync
    setInterval(async () => {
      await this.runSync();
    }, this.interval);

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\\nReceived SIGINT. Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\\nReceived SIGTERM. Shutting down gracefully...');
      process.exit(0);
    });

    console.log('Daemon started. Press Ctrl+C to stop.');
  }

  async run() {
    if (this.isDaemon) {
      await this.runDaemon();
    } else {
      const result = await this.runSync();
      process.exit(result.success ? 0 : 1);
    }
  }
}

// Run the scheduler
const scheduler = new AutoSyncScheduler();
scheduler.run().catch((error) => {
  console.error('Scheduler error:', error);
  process.exit(1);
});