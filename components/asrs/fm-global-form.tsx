'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  FileText, 
  Building, 
  Shield, 
  Zap, 
  Droplets,
  Wind,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  // General Information
  projectName: string;
  projectNumber: string;
  location: string;
  buildingType: string;
  occupancyClass: string;
  
  // Structural Requirements
  seismicZone: string;
  windSpeed: string;
  floorLoadCapacity: string;
  rackHeight: string;
  aisleWidth: string;
  
  // Fire Protection
  sprinklerType: string;
  fireRating: string;
  smokeDetection: string;
  emergencyPower: string;
  
  // Environmental Controls
  temperatureRange: string;
  humidityRange: string;
  airChangesPerHour: string;
  filtrationLevel: string;
  
  // Storage Requirements
  palletType: string;
  maxPalletWeight: string;
  storageCapacity: string;
  throughputRate: string;
  
  // Additional Notes
  specialRequirements: string;
}

export default function FMGlobalForm() {
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    projectNumber: '',
    location: '',
    buildingType: '',
    occupancyClass: '',
    seismicZone: '',
    windSpeed: '',
    floorLoadCapacity: '',
    rackHeight: '',
    aisleWidth: '',
    sprinklerType: '',
    fireRating: '',
    smokeDetection: '',
    emergencyPower: '',
    temperatureRange: '',
    humidityRange: '',
    airChangesPerHour: '',
    filtrationLevel: '',
    palletType: '',
    maxPalletWeight: '',
    storageCapacity: '',
    throughputRate: '',
    specialRequirements: '',
  });

  const [isSubmitting] = useState($2);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // Required fields validation
    if (!formData.projectName) errors.push('Project Name is required');
    if (!formData.projectNumber) errors.push('Project Number is required');
    if (!formData.location) errors.push('Location is required');
    if (!formData.buildingType) errors.push('Building Type is required');
    
    // Numeric validations
    if (formData.windSpeed && isNaN(Number(formData.windSpeed))) {
      errors.push('Wind Speed must be a number');
    }
    if (formData.floorLoadCapacity && isNaN(Number(formData.floorLoadCapacity))) {
      errors.push('Floor Load Capacity must be a number');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically submit to your API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success('ASRS requirements submitted successfully!');
      console.log('Form submitted:', formData);
      
      // Reset form after successful submission
      setFormData({
        projectName: '',
        projectNumber: '',
        location: '',
        buildingType: '',
        occupancyClass: '',
        seismicZone: '',
        windSpeed: '',
        floorLoadCapacity: '',
        rackHeight: '',
        aisleWidth: '',
        sprinklerType: '',
        fireRating: '',
        smokeDetection: '',
        emergencyPower: '',
        temperatureRange: '',
        humidityRange: '',
        airChangesPerHour: '',
        filtrationLevel: '',
        palletType: '',
        maxPalletWeight: '',
        storageCapacity: '',
        throughputRate: '',
        specialRequirements: '',
      });
    } catch (error) {
      toast.error('Failed to submit requirements');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="structural">Structural</TabsTrigger>
          <TabsTrigger value="fire">Fire Protection</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                General Information
              </CardTitle>
              <CardDescription>
                Basic project and building information for FM Global compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectNumber">Project Number *</Label>
                  <Input
                    id="projectNumber"
                    value={formData.projectNumber}
                    onChange={(e) => handleInputChange('projectNumber', e.target.value)}
                    placeholder="Enter project number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State/Country"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingType">Building Type *</Label>
                  <Select 
                    value={formData.buildingType}
                    onValueChange={(value) => handleInputChange('buildingType', value)}
                  >
                    <SelectTrigger id="buildingType">
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="distribution">Distribution Center</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing Facility</SelectItem>
                      <SelectItem value="cold-storage">Cold Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupancyClass">Occupancy Classification</Label>
                  <Select 
                    value={formData.occupancyClass}
                    onValueChange={(value) => handleInputChange('occupancyClass', value)}
                  >
                    <SelectTrigger id="occupancyClass">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s1">S-1 (Moderate Hazard)</SelectItem>
                      <SelectItem value="s2">S-2 (Low Hazard)</SelectItem>
                      <SelectItem value="b">B (Business)</SelectItem>
                      <SelectItem value="f1">F-1 (Factory Industrial)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structural" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Structural Requirements
              </CardTitle>
              <CardDescription>
                Seismic, wind, and load capacity specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seismicZone">Seismic Design Category</Label>
                  <Select 
                    value={formData.seismicZone}
                    onValueChange={(value) => handleInputChange('seismicZone', value)}
                  >
                    <SelectTrigger id="seismicZone">
                      <SelectValue placeholder="Select seismic zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">SDC A</SelectItem>
                      <SelectItem value="b">SDC B</SelectItem>
                      <SelectItem value="c">SDC C</SelectItem>
                      <SelectItem value="d">SDC D</SelectItem>
                      <SelectItem value="e">SDC E</SelectItem>
                      <SelectItem value="f">SDC F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="windSpeed">Design Wind Speed (mph)</Label>
                  <Input
                    id="windSpeed"
                    type="number"
                    value={formData.windSpeed}
                    onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                    placeholder="e.g., 120"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floorLoadCapacity">Floor Load (psf)</Label>
                  <Input
                    id="floorLoadCapacity"
                    type="number"
                    value={formData.floorLoadCapacity}
                    onChange={(e) => handleInputChange('floorLoadCapacity', e.target.value)}
                    placeholder="e.g., 250"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rackHeight">Max Rack Height (ft)</Label>
                  <Input
                    id="rackHeight"
                    value={formData.rackHeight}
                    onChange={(e) => handleInputChange('rackHeight', e.target.value)}
                    placeholder="e.g., 40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aisleWidth">Aisle Width (ft)</Label>
                  <Input
                    id="aisleWidth"
                    value={formData.aisleWidth}
                    onChange={(e) => handleInputChange('aisleWidth', e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fire" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Fire Protection Systems
              </CardTitle>
              <CardDescription>
                Sprinkler systems and fire safety requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sprinklerType">Sprinkler System Type</Label>
                  <Select 
                    value={formData.sprinklerType}
                    onValueChange={(value) => handleInputChange('sprinklerType', value)}
                  >
                    <SelectTrigger id="sprinklerType">
                      <SelectValue placeholder="Select sprinkler type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="esfr">ESFR</SelectItem>
                      <SelectItem value="cmda">CMDA</SelectItem>
                      <SelectItem value="cmsa">CMSA</SelectItem>
                      <SelectItem value="wet-pipe">Wet Pipe</SelectItem>
                      <SelectItem value="dry-pipe">Dry Pipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fireRating">Fire Rating (hours)</Label>
                  <Select 
                    value={formData.fireRating}
                    onValueChange={(value) => handleInputChange('fireRating', value)}
                  >
                    <SelectTrigger id="fireRating">
                      <SelectValue placeholder="Select fire rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="2">2 Hours</SelectItem>
                      <SelectItem value="3">3 Hours</SelectItem>
                      <SelectItem value="4">4 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smokeDetection">Smoke Detection</Label>
                  <Select 
                    value={formData.smokeDetection}
                    onValueChange={(value) => handleInputChange('smokeDetection', value)}
                  >
                    <SelectTrigger id="smokeDetection">
                      <SelectValue placeholder="Select detection type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vesda">VESDA</SelectItem>
                      <SelectItem value="beam">Beam Detection</SelectItem>
                      <SelectItem value="spot">Spot Detection</SelectItem>
                      <SelectItem value="none">None Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPower">Emergency Power</Label>
                  <Select 
                    value={formData.emergencyPower}
                    onValueChange={(value) => handleInputChange('emergencyPower', value)}
                  >
                    <SelectTrigger id="emergencyPower">
                      <SelectValue placeholder="Select power backup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generator">Generator</SelectItem>
                      <SelectItem value="ups">UPS System</SelectItem>
                      <SelectItem value="both">Generator + UPS</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                Environmental Controls
              </CardTitle>
              <CardDescription>
                Temperature, humidity, and air quality requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperatureRange">Temperature Range (°F)</Label>
                  <Input
                    id="temperatureRange"
                    value={formData.temperatureRange}
                    onChange={(e) => handleInputChange('temperatureRange', e.target.value)}
                    placeholder="e.g., 60-80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="humidityRange">Humidity Range (%)</Label>
                  <Input
                    id="humidityRange"
                    value={formData.humidityRange}
                    onChange={(e) => handleInputChange('humidityRange', e.target.value)}
                    placeholder="e.g., 30-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airChangesPerHour">Air Changes Per Hour</Label>
                  <Input
                    id="airChangesPerHour"
                    value={formData.airChangesPerHour}
                    onChange={(e) => handleInputChange('airChangesPerHour', e.target.value)}
                    placeholder="e.g., 6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filtrationLevel">Filtration Level</Label>
                  <Select 
                    value={formData.filtrationLevel}
                    onValueChange={(value) => handleInputChange('filtrationLevel', value)}
                  >
                    <SelectTrigger id="filtrationLevel">
                      <SelectValue placeholder="Select filtration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merv8">MERV 8</SelectItem>
                      <SelectItem value="merv11">MERV 11</SelectItem>
                      <SelectItem value="merv13">MERV 13</SelectItem>
                      <SelectItem value="hepa">HEPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Storage Requirements
              </CardTitle>
              <CardDescription>
                Pallet specifications and storage capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="palletType">Pallet Type</Label>
                  <Select 
                    value={formData.palletType}
                    onValueChange={(value) => handleInputChange('palletType', value)}
                  >
                    <SelectTrigger id="palletType">
                      <SelectValue placeholder="Select pallet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (48x40)</SelectItem>
                      <SelectItem value="euro">Euro (1200x800)</SelectItem>
                      <SelectItem value="custom">Custom Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPalletWeight">Max Pallet Weight (lbs)</Label>
                  <Input
                    id="maxPalletWeight"
                    value={formData.maxPalletWeight}
                    onChange={(e) => handleInputChange('maxPalletWeight', e.target.value)}
                    placeholder="e.g., 2500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storageCapacity">Storage Capacity (pallets)</Label>
                  <Input
                    id="storageCapacity"
                    value={formData.storageCapacity}
                    onChange={(e) => handleInputChange('storageCapacity', e.target.value)}
                    placeholder="e.g., 10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="throughputRate">Throughput Rate (pallets/hr)</Label>
                  <Input
                    id="throughputRate"
                    value={formData.throughputRate}
                    onChange={(e) => handleInputChange('throughputRate', e.target.value)}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Enter any additional requirements or special considerations..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button 
          variant="outline"
          onClick={() => console.log('Save as draft')}
        >
          Save as Draft
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Submit Requirements
            </>
          )}
        </Button>
      </div>
    </div>
  );
}