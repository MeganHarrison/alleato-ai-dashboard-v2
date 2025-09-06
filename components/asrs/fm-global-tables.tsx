'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface Specification {
  id: string;
  category: string;
  requirement: string;
  value: string;
  unit?: string;
  compliance_level: 'mandatory' | 'recommended' | 'optional';
  fm_global_ref?: string;
  notes?: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  category: string;
  date_updated: string;
  version: string;
}

interface ComplianceItem {
  id: string;
  category: string;
  item: string;
  status: 'compliant' | 'non-compliant' | 'pending' | 'n/a';
  last_checked?: string;
  notes?: string;
}

export default function FMGlobalTables() {
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [activeTab, setActiveTab] = useState('specifications');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for specifications
      const mockSpecs: Specification[] = [
        {
          id: '1',
          category: 'Structural',
          requirement: 'Seismic Design Category',
          value: 'SDC D',
          compliance_level: 'mandatory',
          fm_global_ref: 'DS 1-2',
          notes: 'High seismic zone requirements'
        },
        {
          id: '2',
          category: 'Structural',
          requirement: 'Wind Speed Design',
          value: '120',
          unit: 'mph',
          compliance_level: 'mandatory',
          fm_global_ref: 'DS 1-28'
        },
        {
          id: '3',
          category: 'Fire Protection',
          requirement: 'Sprinkler System',
          value: 'ESFR K-25.2',
          compliance_level: 'mandatory',
          fm_global_ref: 'DS 8-34',
          notes: 'Early Suppression Fast Response'
        },
        {
          id: '4',
          category: 'Fire Protection',
          requirement: 'Fire Rating',
          value: '2',
          unit: 'hours',
          compliance_level: 'mandatory',
          fm_global_ref: 'DS 1-21'
        },
        {
          id: '5',
          category: 'Environmental',
          requirement: 'Temperature Range',
          value: '60-80',
          unit: '°F',
          compliance_level: 'recommended',
          fm_global_ref: 'DS 7-13'
        },
        {
          id: '6',
          category: 'Environmental',
          requirement: 'Humidity Control',
          value: '30-60',
          unit: '%',
          compliance_level: 'recommended',
          fm_global_ref: 'DS 7-13'
        },
        {
          id: '7',
          category: 'Storage',
          requirement: 'Max Rack Height',
          value: '40',
          unit: 'ft',
          compliance_level: 'mandatory',
          fm_global_ref: 'DS 8-34'
        },
        {
          id: '8',
          category: 'Storage',
          requirement: 'Aisle Width',
          value: '5',
          unit: 'ft',
          compliance_level: 'mandatory',
          fm_global_ref: 'DS 8-34',
          notes: 'Minimum for ASRS operation'
        }
      ];

      // Mock documents data
      const mockDocs: Document[] = [
        {
          id: '1',
          title: 'FM Global Property Loss Prevention Data Sheet 8-34',
          type: 'Data Sheet',
          category: 'Fire Protection',
          date_updated: '2024-01-15',
          version: '2024.1'
        },
        {
          id: '2',
          title: 'ASRS Design Guidelines',
          type: 'Guideline',
          category: 'Storage',
          date_updated: '2023-12-01',
          version: '3.0'
        },
        {
          id: '3',
          title: 'Seismic Design Requirements',
          type: 'Standard',
          category: 'Structural',
          date_updated: '2024-02-10',
          version: '2024.2'
        },
        {
          id: '4',
          title: 'Fire Protection Systems Installation',
          type: 'Manual',
          category: 'Fire Protection',
          date_updated: '2023-11-20',
          version: '5.2'
        }
      ];

      // Mock compliance data
      const mockCompliance: ComplianceItem[] = [
        {
          id: '1',
          category: 'Structural',
          item: 'Foundation Design Review',
          status: 'compliant',
          last_checked: '2024-01-20'
        },
        {
          id: '2',
          category: 'Structural',
          item: 'Seismic Bracing Installation',
          status: 'pending',
          notes: 'Awaiting final inspection'
        },
        {
          id: '3',
          category: 'Fire Protection',
          item: 'Sprinkler System Testing',
          status: 'compliant',
          last_checked: '2024-02-01'
        },
        {
          id: '4',
          category: 'Fire Protection',
          item: 'Fire Alarm Integration',
          status: 'non-compliant',
          notes: 'Missing FM Global certification'
        },
        {
          id: '5',
          category: 'Environmental',
          item: 'HVAC System Compliance',
          status: 'compliant',
          last_checked: '2024-01-15'
        },
        {
          id: '6',
          category: 'Storage',
          item: 'Rack Load Testing',
          status: 'pending',
          notes: 'Scheduled for Q2 2024'
        }
      ];

      setSpecifications(mockSpecs);
      setDocuments(mockDocs);
      setComplianceItems(mockCompliance);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (level: string) => {
    switch (level) {
      case 'mandatory': return 'destructive';
      case 'recommended': return 'secondary';
      case 'optional': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'non-compliant': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'n/a': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specifications.map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell>
                        <Badge variant="outline">{spec.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{spec.requirement}</TableCell>
                      <TableCell>
                        {spec.value}
                        {spec.unit && <span className="text-muted-foreground ml-1">{spec.unit}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getComplianceColor(spec.compliance_level)}>
                          {spec.compliance_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {spec.fm_global_ref || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {spec.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{doc.version}</TableCell>
                      <TableCell>{new Date(doc.date_updated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                          <span className="capitalize text-sm">{item.status.replace('-', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.last_checked ? new Date(item.last_checked).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}