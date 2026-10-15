export interface SupabaseMCPTools {
  // Database Operations
  listTables: () => Promise<string[]>;
  describeTable: (tableName: string) => Promise<any>;
  queryTable: (tableName: string, query?: unknown) => Promise<any[]>;
  
  // CRUD Operations
  insertRow: (tableName: string, data: unknown) => Promise<any>;
  updateRow: (tableName: string, id: string, data: unknown) => Promise<any>;
  deleteRow: (tableName: string, id: string) => Promise<boolean>;
  
  // SQL Operations
  executeSql: (query: string) => Promise<any>;
  
  // Schema Operations
  createTable: (schema: unknown) => Promise<boolean>;
  alterTable: (tableName: string, changes: unknown) => Promise<boolean>;
  
  // RLS Operations
  listPolicies: (tableName: string) => Promise<any[]>;
  createPolicy: (tableName: string, policy: unknown) => Promise<boolean>;
}