/**
 * AUTONOMOUS LEAD GENERATION SYSTEM
 * Converting ASRS requirements into qualified sales leads
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, CheckCircle, AlertTriangle, FileText, Calculator, 
  Building2, Mail, Phone,
  Download, Send, Target
} from 'lucide-react';

interface LeadData {
  // Company Information
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  title: string;
  location: string;
  
  // Project Details
  projectName: string;
  projectTimeline: string;
  estimatedBudget: string;
  projectType: string;
  
  // ASRS Configuration
  asrsType: 'Shuttle' | 'Mini-Load';
  containerType: 'Closed-Top' | 'Open-Top';
  rackDepth: number;
  rackSpacing: number;
  ceilingHeight?: number;
  commodityType?: string;
  storageHeight?: number;
  
  // Additional Requirements
  specialRequirements: string;
  currentChallenges: string;
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

export default function ASRSLeadGenerationSystem() {
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState<LeadData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    title: '',
    location: '',
    projectName: '',
    projectTimeline: '',
    estimatedBudget: '',
    projectType: '',
    asrsType: 'Shuttle',
    containerType: 'Closed-Top',
    rackDepth: 6,
    rackSpacing: 2.5,
    specialRequirements: '',
    currentChallenges: ''
  });
  
  const [requirements, setRequirements] = useState<ASRSRequirements | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leadScore, setLeadScore] = useState(0);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const updateLeadData = (field: keyof LeadData, value: string | number | undefined) => {
    setLeadData(prev => ({ ...prev, [field]: value }));
  };

  const calculateLeadScore = useCallback((data: LeadData, reqs: ASRSRequirements | null) => {
    let score = 0;
    
    // Company size indicators
    if (data.estimatedBudget) {
      const budget = parseInt(data.estimatedBudget.replace(/\D/g, ''));
      if (budget > 1000000) score += 25;
      else if (budget > 500000) score += 15;
      else if (budget > 100000) score += 10;
    }
    
    // Timeline urgency
    if (data.projectTimeline === 'Immediate' || data.projectTimeline === '1-3 months') score += 20;
    else if (data.projectTimeline === '3-6 months') score += 15;
    
    // System complexity (more sprinklers = higher value)
    if (reqs?.specifications?.sprinklerCount && reqs.specifications.sprinklerCount > 6) score += 15;
    else if (reqs?.specifications?.sprinklerCount && reqs.specifications.sprinklerCount > 4) score += 10;
    
    // Contact quality
    if (data.email.includes('@') && data.phone) score += 10;
    if (data.title.toLowerCase().includes('manager') || 
        data.title.toLowerCase().includes('director') ||
        data.title.toLowerCase().includes('engineer')) score += 15;
    
    // Project type
    if (data.projectType === 'New Construction') score += 10;
    else if (data.projectType === 'Major Retrofit') score += 8;
    
    return Math.min(score, 100);
  }, []);

  const processRequirements = async () => {
    setIsProcessing(true);
    
    try {
      // Get ASRS requirements
      const response = await fetch('/api/asrs/design-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asrsType: leadData.asrsType,
          containerType: leadData.containerType,
          rackDepth: leadData.rackDepth,
          rackSpacing: leadData.rackSpacing,
          ceilingHeight: leadData.ceilingHeight,
          commodityType: leadData.commodityType,
          storageHeight: leadData.storageHeight
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRequirements(data.data);
        const score = calculateLeadScore(leadData, data.data);
        setLeadScore(score);
        
        // Submit lead to CRM
        await submitLead({
          ...leadData,
          requirements: data.data,
          leadScore: score,
          estimatedSprinklerCost: data.data.specifications.sprinklerCount * 150, // $150 per sprinkler estimate
          submittedAt: new Date().toISOString()
        });
        
        setStep(3);
      } else {
        throw new Error(data.error || 'Failed to get requirements');
      }
    } catch (error) {
      console.error('Error processing requirements:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitLead = async (fullLeadData: LeadData & { 
    requirements: ASRSRequirements; 
    leadScore: number; 
    estimatedSprinklerCost: number; 
    submittedAt: string; 
  }) => {
    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullLeadData)
      });
      
      if (!response.ok) throw new Error('Failed to submit lead');
      
      console.log('✅ Lead submitted successfully');
    } catch (error) {
      console.error('❌ Lead submission failed:', error);
    }
  };

  const generateQuote = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData,
          requirements,
          leadScore
        })
      });
      
      if (response.ok) {
        setQuoteGenerated(true);
        console.log('✅ Quote generated');
      }
    } catch (error) {
      console.error('❌ Quote generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getLeadScoreLabel = (score: number) => {
    if (score >= 80) return 'HOT LEAD';
    if (score >= 60) return 'WARM LEAD';
    return 'COLD LEAD';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">ASRS Sprinkler Quote Generator</h1>
        <p className="text-xl text-muted-foreground">
          Get instant FM Global 8-34 compliant requirements & pricing
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant={step >= 1 ? "default" : "outline"}>1. Project Info</Badge>
          <Badge variant={step >= 2 ? "default" : "outline"}>2. ASRS Config</Badge>
          <Badge variant={step >= 3 ? "default" : "outline"}>3. Requirements</Badge>
        </div>
      </div>

      {/* Step 1: Company & Project Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={leadData.companyName}
                  onChange={(e) => updateLeadData('companyName', e.target.value)}
                  placeholder="Your Company"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={leadData.contactName}
                  onChange={(e) => updateLeadData('contactName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadData.email}
                  onChange={(e) => updateLeadData('email', e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={leadData.phone}
                  onChange={(e) => updateLeadData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={leadData.title}
                  onChange={(e) => updateLeadData('title', e.target.value)}
                  placeholder="Project Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={leadData.location}
                  onChange={(e) => updateLeadData('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={leadData.projectName}
                  onChange={(e) => updateLeadData('projectName', e.target.value)}
                  placeholder="Warehouse Expansion"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={leadData.projectType} onValueChange={(value) => updateLeadData('projectType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Construction">New Construction</SelectItem>
                    <SelectItem value="Major Retrofit">Major Retrofit</SelectItem>
                    <SelectItem value="Upgrade">System Upgrade</SelectItem>
                    <SelectItem value="Expansion">Facility Expansion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Project Timeline</Label>
                <Select value={leadData.projectTimeline} onValueChange={(value) => updateLeadData('projectTimeline', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">Immediate (Rush)</SelectItem>
                    <SelectItem value="1-3 months">1-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6-12 months">6-12 months</SelectItem>
                    <SelectItem value="12+ months">12+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Estimated Budget</Label>
                <Select value={leadData.estimatedBudget} onValueChange={(value) => updateLeadData('estimatedBudget', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $100k">Under $100k</SelectItem>
                    <SelectItem value="$100k - $500k">$100k - $500k</SelectItem>
                    <SelectItem value="$500k - $1M">$500k - $1M</SelectItem>
                    <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                    <SelectItem value="Over $5M">Over $5M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              size="lg" 
              className="w-full"
              disabled={!leadData.companyName || !leadData.contactName || !leadData.email || !leadData.phone}
            >
              Continue to ASRS Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: ASRS Configuration */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              ASRS System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ASRS Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ASRS Type *</Label>
                <Select value={leadData.asrsType} onValueChange={(value: 'Shuttle' | 'Mini-Load') => updateLeadData('asrsType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shuttle">Shuttle ASRS</SelectItem>
                    <SelectItem value="Mini-Load">Mini-Load ASRS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Container Type *</Label>
                <Select value={leadData.containerType} onValueChange={(value: 'Closed-Top' | 'Open-Top') => updateLeadData('containerType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Closed-Top">Closed-Top</SelectItem>
                    <SelectItem value="Open-Top">Open-Top</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rack Depth (ft) *</Label>
                <Select value={leadData.rackDepth.toString()} onValueChange={(value) => updateLeadData('rackDepth', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 ft</SelectItem>
                    <SelectItem value="6">6 ft</SelectItem>
                    <SelectItem value="9">9 ft</SelectItem>
                    <SelectItem value="14">14 ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rack Spacing (ft) *</Label>
                <Select value={leadData.rackSpacing.toString()} onValueChange={(value) => updateLeadData('rackSpacing', parseFloat(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2.0 ft</SelectItem>
                    <SelectItem value="2.5">2.5 ft</SelectItem>
                    <SelectItem value="5">5.0 ft</SelectItem>
                    <SelectItem value="8">8.0 ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ceiling Height (ft)</Label>
                <Input
                  type="number"
                  value={leadData.ceilingHeight || ''}
                  onChange={(e) => updateLeadData('ceilingHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 25"
                />
              </div>

              <div className="space-y-2">
                <Label>Commodity Type</Label>
                <Select value={leadData.commodityType || ''} onValueChange={(value) => updateLeadData('commodityType', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class I">Class I</SelectItem>
                    <SelectItem value="Class II">Class II</SelectItem>
                    <SelectItem value="Class III">Class III</SelectItem>
                    <SelectItem value="Class IV">Class IV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Special Requirements</Label>
                <Textarea
                  value={leadData.specialRequirements}
                  onChange={(e) => updateLeadData('specialRequirements', e.target.value)}
                  placeholder="Any special requirements, constraints, or considerations..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Current Challenges</Label>
                <Textarea
                  value={leadData.currentChallenges}
                  onChange={(e) => updateLeadData('currentChallenges', e.target.value)}
                  placeholder="What challenges are you facing with your current system?"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={processRequirements} 
                disabled={isProcessing}
                size="lg" 
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Generate Requirements & Quote'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results & Lead Qualification */}
      {step === 3 && requirements && (
        <div className="space-y-6">
          {/* Lead Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Lead Qualification
                </div>
                <Badge className={`${getLeadScoreColor(leadScore)} px-3 py-1 text-sm font-bold`}>
                  {getLeadScoreLabel(leadScore)} ({leadScore}/100)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">${(requirements.specifications.sprinklerCount * 150).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Est. Sprinkler Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{leadData.projectTimeline}</div>
                  <div className="text-sm text-muted-foreground">Timeline</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{leadData.estimatedBudget}</div>
                  <div className="text-sm text-muted-foreground">Project Budget</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                FM Global 8-34 Compliance Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Compliance</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Figure:</strong> {requirements.compliance.applicableFigure}</div>
                      <div><strong>Table:</strong> {requirements.compliance.applicableTable}</div>
                      <div><strong>Page:</strong> {requirements.compliance.pageReference}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Specifications</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Sprinklers:</strong> {requirements.specifications.sprinklerCount}</div>
                      <div><strong>Pattern:</strong> {requirements.specifications.sprinklerNumbering}</div>
                      <div><strong>Scheme:</strong> {requirements.specifications.protectionScheme}</div>
                    </div>
                  </div>
                </div>
              </div>

              {requirements.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {requirements.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={generateQuote}
              disabled={isProcessing || quoteGenerated}
              size="lg"
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quote...
                </>
              ) : quoteGenerated ? (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Quote PDF
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Detailed Quote
                </>
              )}
            </Button>
            
            <Button variant="outline" size="lg" className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Schedule Consultation
            </Button>
          </div>

          {/* Contact Information */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Need Expert Guidance?</h3>
                <p className="text-muted-foreground">
                  Our ASRS sprinkler specialists are ready to help optimize your design
                </p>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>quotes@alleato.com</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
