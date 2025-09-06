export interface SupabaseMCPTools {
  // Database Operations
  listTables: () => Promise<string[]>;
  describeTable: (tableName: string) => Promise<any>;
  queryTable: (tableName: string, query?: any) => Promise<any[]>;
  
  // CRUD Operations
  insertRow: (tableName: string, data: any) => Promise<any>;
  updateRow: (tableName: string, id: string, data: any) => Promise<any>;
  deleteRow: (tableName: string, id: string) => Promise<boolean>;
  
  // SQL Operations
  executeSql: (query: string) => Promise<any>;
  
  // Schema Operations
  createTable: (schema: any) => Promise<boolean>;
  alterTable: (tableName: string, changes: any) => Promise<boolean>;
  
  // RLS Operations
  listPolicies: (tableName: string) => Promise<any[]>;
  createPolicy: (tableName: string, policy: any) => Promise<boolean>;
}