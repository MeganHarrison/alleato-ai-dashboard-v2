'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, FileText, Calculator } from 'lucide-react';

interface ASRSInput {
  asrsType: 'Shuttle' | 'Mini-Load';
  containerType: 'Closed-Top' | 'Open-Top';
  rackDepth: number;
  rackSpacing: number;
  ceilingHeight?: number;
  commodityType?: string;
  storageHeight?: number;
}

interface ASRSRequirements {
  compliance: {
    applicableFigure: number | null;
    applicableTable: number | null;
    pageReference: number | null;
    isCompliant: boolean;
    figureTitle: string | null;
  };
  specifications: {
    sprinklerCount: number;
    sprinklerNumbering: string;
    spacing: number | null;
    rackDepth: number | null;
    protectionScheme: string;
    flueSpacesRequired: boolean;
    verticalBarriersRequired: boolean;
  };
  warnings: string[];
  metadata: {
    searchKey: string;
    matchType: 'exact' | 'closest' | 'none';
    timestamp: string;
  };
}

export default function ASRSRequirementsCalculator() {
  const [input, setInput] = useState<ASRSInput>({
    asrsType: 'Shuttle',
    containerType: 'Closed-Top',
    rackDepth: 6,
    rackSpacing: 2.5,
    ceilingHeight: 25,
    commodityType: 'Class II',
    storageHeight: 20,
  });
  
  const [result, setResult] = useState<ASRSRequirements | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRequirements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/asrs/design-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get requirements');
      }
      
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const updateInput = (field: keyof ASRSInput, value: string | number | undefined) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">ASRS Requirements Calculator</h1>
        <p className="text-muted-foreground">
          Get exact FM Global 8-34 compliance requirements for your ASRS system configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ASRS Type */}
            <div className="space-y-2">
              <Label htmlFor="asrsType">ASRS Type *</Label>
              <Select value={input.asrsType} onValueChange={(value: 'Shuttle' | 'Mini-Load') => updateInput('asrsType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ASRS type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shuttle">Shuttle ASRS</SelectItem>
                  <SelectItem value="Mini-Load">Mini-Load ASRS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Container Type */}
            <div className="space-y-2">
              <Label htmlFor="containerType">Container Type *</Label>
              <Select value={input.containerType} onValueChange={(value: 'Closed-Top' | 'Open-Top') => updateInput('containerType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select container type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Closed-Top">Closed-Top</SelectItem>
                  <SelectItem value="Open-Top">Open-Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rack Depth */}
            <div className="space-y-2">
              <Label htmlFor="rackDepth">Rack Depth (ft) *</Label>
              <Select value={input.rackDepth.toString()} onValueChange={(value) => updateInput('rackDepth', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rack depth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 ft</SelectItem>
                  <SelectItem value="6">6 ft</SelectItem>
                  <SelectItem value="9">9 ft</SelectItem>
                  <SelectItem value="14">14 ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rack Spacing */}
            <div className="space-y-2">
              <Label htmlFor="rackSpacing">Rack Spacing (ft) *</Label>
              <Select value={input.rackSpacing.toString()} onValueChange={(value) => updateInput('rackSpacing', parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rack spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2.0 ft</SelectItem>
                  <SelectItem value="2.5">2.5 ft</SelectItem>
                  <SelectItem value="5">5.0 ft</SelectItem>
                  <SelectItem value="8">8.0 ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ceiling Height */}
            <div className="space-y-2">
              <Label htmlFor="ceilingHeight">Ceiling Height (ft)</Label>
              <Input
                type="number"
                value={input.ceilingHeight || ''}
                onChange={(e) => updateInput('ceilingHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 25"
              />
            </div>

            {/* Commodity Type */}
            <div className="space-y-2">
              <Label htmlFor="commodityType">Commodity Type</Label>
              <Select value={input.commodityType || ''} onValueChange={(value) => updateInput('commodityType', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select commodity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class I">Class I</SelectItem>
                  <SelectItem value="Class II">Class II</SelectItem>
                  <SelectItem value="Class III">Class III</SelectItem>
                  <SelectItem value="Class IV">Class IV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Storage Height */}
            <div className="space-y-2">
              <Label htmlFor="storageHeight">Storage Height (ft)</Label>
              <Input
                type="number"
                value={input.storageHeight || ''}
                onChange={(e) => updateInput('storageHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 20"
              />
            </div>

            <Button
              onClick={calculateRequirements}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Get Requirements'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Design Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-6">
                {/* Compliance Status */}
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">FM Global 8-34 Compliance</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600 font-medium">Figure:</p>
                      <p className="text-green-800">{result.compliance.applicableFigure || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="text-green-600 font-medium">Table:</p>
                      <p className="text-green-800">{result.compliance.applicableTable || 'TBD'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-green-600 font-medium">Page Reference:</p>
                      <p className="text-green-800">{result.compliance.pageReference || 'TBD'}</p>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3">Sprinkler Specifications</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600 font-medium">Sprinkler Count:</p>
                      <p className="text-blue-800 font-mono text-lg">{result.specifications.sprinklerCount}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Numbering:</p>
                      <p className="text-blue-800 font-mono">{result.specifications.sprinklerNumbering || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Spacing:</p>
                      <p className="text-blue-800">{result.specifications.spacing} ft</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Protection Scheme:</p>
                      <p className="text-blue-800">{result.specifications.protectionScheme}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {result.specifications.flueSpacesRequired && (
                      <Badge variant="secondary">Flue Spaces Required</Badge>
                    )}
                    {result.specifications.verticalBarriersRequired && (
                      <Badge variant="secondary">Vertical Barriers Required</Badge>
                    )}
                  </div>
                </div>

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {result.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>Match Type: {result.metadata.matchType}</p>
                  <p>Generated: {new Date(result.metadata.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure your system parameters and click &quot;Get Requirements&quot; to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
