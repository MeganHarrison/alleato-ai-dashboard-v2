/**
 * Environment variable validation and checking
 */

export function checkRequiredEnvVars(): { 
  valid: boolean; 
  missing: string[]; 
  warnings: string[] 
} {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', warnings);
  }

  return { 
    valid: missing.length === 0, 
    missing, 
    warnings 
  };
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value || defaultValue || '';
}