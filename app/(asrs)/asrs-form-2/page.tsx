'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, AlertTriangle, TrendingUp, XCircle, HelpCircle } from 'lucide-react';

const FMGlobalRequirementsForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Project Info
    projectName: '',
    companyName: '',
    contactEmail: '',
    
    // ASRS Classification (Step 1)
    asrsType: '',
    systemType: '',
    
    // Container Configuration (Step 2) 
    containerMaterial: '',
    containerConfiguration: '',
    containerWallType: '',
    containerBottomType: 'solid',
    
    // Physical Dimensions (Step 3)
    storageHeightFt: '',
    ceilingHeightFt: '',
    aisleWidthFt: '',
    rackRowDepthFt: '',
    numberOfLevels: '',
    tierHeightIn: '',
    
    // Commodity Information (Step 4)
    commodityClass: '',
    plasticType: '',
    specialHazards: [] as string[],
    
    // Environmental Conditions (Step 5)
    ambientTemp: 'ambient',
    buildingType: 'noncombustible',
    ventilationType: 'natural',
    
    // System Requirements (Step 6)
    preferredSystem: 'wet',
    availablePressurePsi: '',
    budgetRange: ''
  });

  const [recommendations, setRecommendations] = useState<Array<{
    type: string;
    title: string;
    message: string;
    impact: string;
    costImpact: string;
  }>>([]);
  const [costAnalysis, setCostAnalysis] = useState<{
    baseCost: number;
    complexity: number;
    estimatedCost: number;
    confidence: string;
  } | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<Array<{
    type: string;
    title: string;
    description: string;
    savings: string;
    feasibility: string;
    implementationEffort: string;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResults, setApiResults] = useState<Record<string, unknown> | null>(null);

  // API endpoint - replace with your deployed worker URL
  const API_BASE_URL = 'https://fm-global-asrs-api-production.megan-d14.workers.dev';

  const generateRecommendations = () => {
    const recs = [];
    
    // Container configuration impact
    if (formData.containerConfiguration === 'open_top' && formData.containerMaterial === 'combustible') {
      recs.push({
        type: 'warning',
        title: 'High-Cost Configuration Detected',
        message: 'Open-top combustible containers typically require in-rack sprinklers, significantly increasing costs.',
        impact: 'high',
        costImpact: '$75,000 - $200,000'
      });
    }
    
    // Height threshold warnings
    if (parseInt(formData.storageHeightFt) > 20) {
      recs.push({
        type: 'info',
        title: 'Enhanced Protection Required',
        message: 'Storage heights >20ft may trigger enhanced protection requirements.',
        impact: 'medium',
        costImpact: '$25,000 - $75,000'
      });
    }
    
    // Aisle width optimization
    if (parseInt(formData.aisleWidthFt) === 7) {
      recs.push({
        type: 'optimization',
        title: 'Aisle Width Optimization Opportunity',
        message: 'Consider 6ft or 8ft aisle width - 7ft may not provide optimal protection requirements.',
        impact: 'medium',
        costImpact: 'Potential $15,000 savings'
      });
    }
    
    setRecommendations(recs);
  };

  const analyzeCostImpact = () => {
    let baseCost = 50000; // Base ceiling system cost
    let complexity = 1;
    
    // ASRS type impact
    if (formData.asrsType === 'mini_load') complexity *= 1.3;
    if (formData.asrsType === 'top_loading') complexity *= 1.1;
    
    // Container configuration impact
    if (formData.containerConfiguration === 'open_top') {
      baseCost += 100000; // In-rack sprinklers
      complexity *= 1.5;
    }
    
    // Height impact
    const height = parseInt(formData.storageHeightFt) || 15;
    if (height > 30) complexity *= 1.4;
    else if (height > 20) complexity *= 1.2;
    
    // Material impact
    if (formData.containerMaterial === 'expanded_plastic') complexity *= 1.6;
    else if (formData.containerMaterial === 'combustible') complexity *= 1.3;
    
    const estimatedCost = Math.round(baseCost * complexity);
    
    setCostAnalysis({
      baseCost: baseCost,
      complexity: complexity,
      estimatedCost: estimatedCost,
      confidence: complexity < 1.5 ? 'high' : complexity < 2 ? 'medium' : 'low'
    });
  };

  const findOptimizationOpportunities = () => {
    const suggestions = [];
    
    // Container optimization
    if (formData.containerConfiguration === 'open_top') {
      suggestions.push({
        type: 'container_change',
        title: 'Switch to Closed-Top Containers',
        description: 'Closed-top containers eliminate in-rack sprinkler requirements',
        savings: '$75,000 - $150,000',
        feasibility: 'medium',
        implementationEffort: 'Product packaging redesign required'
      });
    }
    
    // System type optimization
    if (formData.preferredSystem === 'dry' && formData.ambientTemp === 'heated') {
      suggestions.push({
        type: 'system_change',
        title: 'Consider Wet System',
        description: 'Wet systems typically require fewer sprinklers in heated environments',
        savings: '$15,000 - $35,000',
        feasibility: 'high',
        implementationEffort: 'Low - design change only'
      });
    }
    
    // Height optimization
    const height = parseInt(formData.storageHeightFt);
    if (height > 20 && height < 25) {
      suggestions.push({
        type: 'height_reduction',
        title: 'Reduce Storage Height to 20ft',
        description: 'Staying under 20ft threshold simplifies protection requirements',
        savings: '$25,000 - $50,000',
        feasibility: 'medium',
        implementationEffort: 'Rack reconfiguration required'
      });
    }
    
    setOptimizationSuggestions(suggestions);
  };

  const getApplicableTables = () => {
    // This would normally query your FM Global tables based on current config
    const tables = [];
    
    if (formData.asrsType === 'mini_load') {
      if (formData.containerConfiguration === 'closed_top') {
        tables.push({ number: 4, title: 'Mini-Load ASRS Ceiling Protection', confidence: 95 });
        tables.push({ number: 15, title: 'Enhanced Protection Requirements', confidence: 78 });
      } else if (formData.containerConfiguration === 'open_top') {
        tables.push({ number: 26, title: 'In-Rack Sprinkler Requirements', confidence: 90 });
        tables.push({ number: 41, title: 'Combined Ceiling + In-Rack Protection', confidence: 85 });
      }
    }
    
    return tables;
  };

  // Real-time validation and suggestions
  useEffect(() => {
    if (currentStep >= 2) {
      generateRecommendations();
      analyzeCostImpact();
      findOptimizationOpportunities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, currentStep]);

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Step 1: ASRS System Classification</h3>
      
      <div>
        <Label htmlFor="asrsType">ASRS System Type</Label>
        <Select value={formData.asrsType} onValueChange={(value) => setFormData({...formData, asrsType: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select ASRS type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mini_load">Horizontal-Loading Mini-Load (angle irons/guides)</SelectItem>
            <SelectItem value="shuttle">Horizontal-Loading Shuttle (slats/mesh)</SelectItem>
            <SelectItem value="top_loading">Top-Loading ASRS (robot access from above)</SelectItem>
            <SelectItem value="vertically_enclosed">Vertically Enclosed ASRS (lift/carousel)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-600 mt-1">
          This determines which FM Global protection tables apply to your system.
        </p>
      </div>

      <div>
        <Label>Preferred Sprinkler System Type</Label>
        <RadioGroup value={formData.systemType} onValueChange={(value) => setFormData({...formData, systemType: value})}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="wet" id="wet" />
            <Label htmlFor="wet">Wet System (pipes filled with water)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dry" id="dry" />
            <Label htmlFor="dry">Dry System (pipes filled with air/nitrogen)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="both" id="both" />
            <Label htmlFor="both">Need guidance on best option</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Step 2: Container Configuration</h3>
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Container configuration has the biggest impact on sprinkler requirements and costs.
        </AlertDescription>
      </Alert>
      
      <div>
        <Label htmlFor="containerMaterial">Container Material</Label>
        <Select value={formData.containerMaterial} onValueChange={(value) => setFormData({...formData, containerMaterial: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select material type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metal">Metal (noncombustible)</SelectItem>
            <SelectItem value="combustible">Cardboard/Corrugated (combustible)</SelectItem>
            <SelectItem value="unexpanded_plastic">Unexpanded Plastic</SelectItem>
            <SelectItem value="expanded_plastic">Expanded Plastic (requires special analysis)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="containerConfiguration">Container Top Configuration</Label>
        <RadioGroup value={formData.containerConfiguration} onValueChange={(value) => setFormData({...formData, containerConfiguration: value})}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="closed_top" id="closed" />
            <Label htmlFor="closed">Closed-Top <Badge variant="outline" className="ml-2 text-green-600">Lower Cost</Badge></Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="open_top" id="open" />
            <Label htmlFor="open">Open-Top <Badge variant="outline" className="ml-2 text-red-600">Higher Cost</Badge></Label>
          </div>
        </RadioGroup>
        {formData.containerConfiguration === 'open_top' && (
          <Alert className="mt-2 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-800">
              Open-top containers typically require in-rack sprinklers, significantly increasing costs.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <Label htmlFor="containerWallType">Container Wall Type</Label>
        <RadioGroup value={formData.containerWallType} onValueChange={(value) => setFormData({...formData, containerWallType: value})}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="solid" id="solid_wall" />
            <Label htmlFor="solid_wall">Solid Walls</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="non_solid" id="non_solid_wall" />
            <Label htmlFor="non_solid_wall">Non-Solid Walls (mesh, perforated)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Step 3: Physical Dimensions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="storageHeight">Maximum Storage Height (ft)</Label>
          <Input
            id="storageHeight"
            type="number"
            value={formData.storageHeightFt}
            onChange={(e) => setFormData({...formData, storageHeightFt: e.target.value})}
            placeholder="20"
          />
          {parseInt(formData.storageHeightFt) > 20 && (
            <p className="text-sm text-yellow-600 mt-1">⚠️ Heights {'>'}20ft may require enhanced protection</p>
          )}
        </div>

        <div>
          <Label htmlFor="ceilingHeight">Ceiling Height (ft)</Label>
          <Input
            id="ceilingHeight"
            type="number"
            value={formData.ceilingHeightFt}
            onChange={(e) => setFormData({...formData, ceilingHeightFt: e.target.value})}
            placeholder="30"
          />
        </div>

        <div>
          <Label htmlFor="aisleWidth">Aisle Width (ft)</Label>
          <Input
            id="aisleWidth"
            type="number"
            value={formData.aisleWidthFt}
            onChange={(e) => setFormData({...formData, aisleWidthFt: e.target.value})}
            placeholder="6"
          />
          {formData.aisleWidthFt === '7' && (
            <p className="text-sm text-blue-600 mt-1">💡 Consider 6ft or 8ft for optimal requirements</p>
          )}
        </div>

        <div>
          <Label htmlFor="rackDepth">Rack Row Depth (ft)</Label>
          <Input
            id="rackDepth"
            type="number"
            value={formData.rackRowDepthFt}
            onChange={(e) => setFormData({...formData, rackRowDepthFt: e.target.value})}
            placeholder="4"
          />
        </div>

        <div>
          <Label htmlFor="levels">Number of Storage Levels</Label>
          <Input
            id="levels"
            type="number"
            value={formData.numberOfLevels}
            onChange={(e) => setFormData({...formData, numberOfLevels: e.target.value})}
            placeholder="12"
          />
        </div>

        <div>
          <Label htmlFor="tierHeight">Tier Height (inches)</Label>
          <Input
            id="tierHeight"
            type="number"
            value={formData.tierHeightIn}
            onChange={(e) => setFormData({...formData, tierHeightIn: e.target.value})}
            placeholder="15"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Step 4: Commodity Information</h3>
      
      <div>
        <Label htmlFor="commodityClass">FM Global Commodity Classification</Label>
        <Select value={formData.commodityClass} onValueChange={(value) => setFormData({...formData, commodityClass: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select commodity class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="class_1">Class 1 - Noncombustible products in noncombustible packaging</SelectItem>
            <SelectItem value="class_2">Class 2 - Noncombustible products in combustible packaging</SelectItem>
            <SelectItem value="class_3">Class 3 - Combustible products (wood, paper, natural fibers)</SelectItem>
            <SelectItem value="class_4">Class 4 - Class 1-3 with limited plastic content</SelectItem>
            <SelectItem value="plastic_cartoned">Plastic - Cartoned unexpanded</SelectItem>
            <SelectItem value="plastic_exposed">Plastic - Exposed unexpanded</SelectItem>
            <SelectItem value="plastic_expanded">Plastic - Expanded (requires special analysis)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Special Hazards (check all that apply)</Label>
        <div className="space-y-2 mt-2">
          {['Lithium-ion batteries', 'Aerosols', 'Ignitable liquids', 'Hazardous chemicals'].map((hazard) => (
            <div key={hazard} className="flex items-center space-x-2">
              <Checkbox 
                id={hazard}
                checked={formData.specialHazards.includes(hazard)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({...formData, specialHazards: [...formData.specialHazards, hazard]});
                  } else {
                    setFormData({...formData, specialHazards: formData.specialHazards.filter(h => h !== hazard)});
                  }
                }}
              />
              <Label htmlFor={hazard}>{hazard}</Label>
            </div>
          ))}
        </div>
        {formData.specialHazards.length > 0 && (
          <Alert className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Special hazards require additional FM Global standards beyond 8-34.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Analysis Results</h3>
      
      {costAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Base Cost</p>
                <p className="text-2xl font-bold">${costAnalysis.baseCost.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Complexity Factor</p>
                <p className="text-2xl font-bold text-red-600">{costAnalysis.complexity.toFixed(1)}x</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Estimated Total</p>
                <p className="text-3xl font-bold text-green-600">${costAnalysis.estimatedCost.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Confidence: <Badge variant={costAnalysis.confidence === 'high' ? 'default' : costAnalysis.confidence === 'medium' ? 'secondary' : 'destructive'}>
                {costAnalysis.confidence}
              </Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Cost Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{suggestion.title}</h4>
                    <Badge variant="outline" className="text-green-600">
                      {suggestion.savings}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Feasibility: <Badge variant={suggestion.feasibility === 'high' ? 'default' : 'secondary'}>
                      {suggestion.feasibility}
                    </Badge></span>
                    <span className="text-gray-500">{suggestion.implementationEffort}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Applicable FM Global Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getApplicableTables().map((table, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span>Table {table.number}: {table.title}</span>
                <Badge variant="outline">{table.confidence}% match</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email for Detailed Quote</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                placeholder="engineer@company.com"
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder="Your company"
              />
            </div>
            <Button className="w-full" size="lg">
              Get Professional Analysis & Quote
            </Button>
            <p className="text-sm text-center text-gray-600">
              Our engineers will review your configuration and provide detailed recommendations within 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { number: 1, title: 'ASRS Type', component: renderStep1 },
    { number: 2, title: 'Containers', component: renderStep2 },
    { number: 3, title: 'Dimensions', component: renderStep3 },
    { number: 4, title: 'Commodities', component: renderStep4 },
    { number: 5, title: 'Results', component: renderResults }
  ];

  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return formData.asrsType && formData.systemType;
      case 2:
        return formData.containerMaterial && formData.containerConfiguration && formData.containerWallType;
      case 3:
        return formData.storageHeightFt && formData.ceilingHeightFt && formData.aisleWidthFt;
      case 4:
        return formData.commodityClass;
      default:
        return true;
    }
  };

  // Submit form to deployed worker
  const handleSubmitToAPI = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setApiResults(result);
      console.log('API Response:', result);
      
    } catch (error) {
      console.error('Submission error:', error);
      setApiResults({ error: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FM Global 8-34 ASRS Requirements Assessment</h1>
        <p className="text-gray-600">Get instant sprinkler requirements and cost optimization suggestions</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.slice(0, -1).map((step) => (
            <div key={step.number} className={`flex items-center ${step.number < steps.length ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.number}
              </div>
              <span className={`ml-2 text-sm ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.title}
              </span>
              {step.number < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="mt-2" />
      </div>

      {/* Current Step Content */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {steps[currentStep - 1].component()}
        </CardContent>
      </Card>

      {/* Recommendations Panel */}
      {recommendations.length > 0 && currentStep < 5 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Real-time Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Alert key={index} className={rec.type === 'warning' ? 'border-red-200' : rec.type === 'optimization' ? 'border-green-200' : 'border-blue-200'}>
                  {rec.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                  {rec.type === 'optimization' && <TrendingUp className="h-4 w-4" />}
                  {rec.type === 'info' && <HelpCircle className="h-4 w-4" />}
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-sm mt-1">{rec.message}</p>
                      </div>
                      <Badge variant="outline" className={
                        rec.impact === 'high' ? 'text-red-600' :
                        rec.impact === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }>
                        {rec.costImpact}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < 5 && (
          <Button 
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
          >
            Next Step
          </Button>
        )}
        
        {currentStep === 5 && (
          <Button 
            variant="default" 
            size="lg"
            onClick={handleSubmitToAPI}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit to API & Generate Report'}
          </Button>
        )}
      </div>

      {/* API Results Display */}
      {apiResults && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(apiResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FMGlobalRequirementsForm;