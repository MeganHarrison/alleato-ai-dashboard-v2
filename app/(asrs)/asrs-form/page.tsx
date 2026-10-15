'use client';

import React, { useState } from 'react';

interface ASRSFormData {
  asrs_type?: 'Shuttle' | 'Mini-Load' | 'Horizontal Carousel';
  container_type?: 'Closed-Top' | 'Open-Top' | 'Mixed';
  rack_depth_ft?: number;
  rack_spacing_ft?: number;
  ceiling_height_ft?: number;
  aisle_width_ft?: number;
  commodity_type?: string[];
  storage_height_ft?: number;
  system_type?: 'wet' | 'dry' | 'both';
  building_type?: string;
  sprinkler_coverage?: 'standard' | 'extended';
  expected_throughput?: 'low' | 'medium' | 'high';
}

interface FormQuestion {
  id: keyof ASRSFormData;
  type: 'select' | 'number' | 'multiselect' | 'radio';
  question: string;
  options?: { value: string; label: string; description?: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required: boolean;
  helpText?: string;
  conditional?: (data: ASRSFormData) => boolean;
  validation?: (value: unknown) => string | null;
}

export default function ASRSRequirementsForm() {
  const [formData, setFormData] = useState<ASRSFormData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [designResult, setDesignResult] = useState<{
    applicable_figures: string[];
    applicable_tables: string[];
    sprinkler_count: number;
    protection_scheme: string;
    in_rack_required?: boolean;
    submission_id?: string;
  } | null>(null);
  

  const questions: FormQuestion[] = [
    {
      id: 'asrs_type',
      type: 'select',
      question: 'What type of ASRS system are you implementing?',
      options: [
        { 
          value: 'Shuttle', 
          label: 'Shuttle ASRS', 
          description: 'Horizontal loading mechanism with shuttle carriers. Best for high-density storage.' 
        },
        { 
          value: 'Mini-Load', 
          label: 'Mini-Load ASRS', 
          description: 'Vertical loading for smaller items. Ideal for parts and components.' 
        },
        { 
          value: 'Horizontal Carousel', 
          label: 'Horizontal Carousel', 
          description: 'Rotating carousel system for medium-density applications.' 
        }
      ],
      required: true,
      helpText: 'This determines the applicable FM Global 8-34 protection requirements and design tables.'
    },
    {
      id: 'container_type',
      type: 'select',
      question: 'What type of containers will be stored in the ASRS?',
      options: [
        { 
          value: 'Closed-Top', 
          label: 'Closed-Top Containers', 
          description: 'Fully enclosed storage containers - Lower fire protection requirements' 
        },
        { 
          value: 'Open-Top', 
          label: 'Open-Top Containers', 
          description: 'Open containers or exposed products - Higher protection requirements' 
        },
        { 
          value: 'Mixed', 
          label: 'Mixed Container Types', 
          description: 'Combination of closed and open containers - Most complex protection scheme' 
        }
      ],
      required: true,
      conditional: (data) => !!data.asrs_type,
      helpText: 'Container type significantly impacts sprinkler design and protection scheme selection.'
    },
    {
      id: 'rack_depth_ft',
      type: 'number',
      question: 'What is the maximum rack depth in feet?',
      min: 3,
      max: 25,
      step: 0.5,
      unit: 'feet',
      required: true,
      conditional: (data) => !!data.container_type,
      helpText: 'Rack depth determines figure selection and sprinkler arrangement requirements.',
      validation: (value) => {
        const numValue = Number(value);
        if (numValue < 3) return 'Minimum rack depth is 3 feet per FM Global requirements';
        if (numValue > 25) return 'Rack depths over 25 feet require special engineering review';
        return null;
      }
    },
    {
      id: 'rack_spacing_ft',
      type: 'number',
      question: 'What is the rack spacing (aisle width between racks)?',
      min: 2.5,
      max: 8,
      step: 0.5,
      unit: 'feet',
      required: true,
      conditional: (data) => !!data.rack_depth_ft,
      helpText: 'Spacing affects sprinkler coverage patterns and hydraulic design requirements.'
    },
    {
      id: 'ceiling_height_ft',
      type: 'number',
      question: 'What is the ceiling height?',
      min: 15,
      max: 45,
      step: 1,
      unit: 'feet',
      required: true,
      conditional: (data) => !!data.rack_spacing_ft,
      helpText: 'Ceiling height determines sprinkler K-factor requirements and design area calculations.'
    },
    {
      id: 'storage_height_ft',
      type: 'number',
      question: 'What is the maximum storage height?',
      min: 8,
      max: 40,
      step: 1,
      unit: 'feet',
      required: true,
      conditional: (data) => !!data.ceiling_height_ft,
      validation: (value) => {
        const ceilingHeight = formData.ceiling_height_ft || 0;
        const numValue = Number(value);
        if (numValue >= ceilingHeight - 4) {
          return 'Storage height must be at least 4 feet below ceiling per FM Global requirements';
        }
        return null;
      },
      helpText: 'Storage height affects clearance requirements and in-rack sprinkler needs.'
    },
    {
      id: 'commodity_type',
      type: 'multiselect',
      question: 'What types of commodities will be stored?',
      options: [
        { value: 'Class I', label: 'Class I Commodities', description: 'Non-combustible products in combustible packaging' },
        { value: 'Class II', label: 'Class II Commodities', description: 'Class I products in slatted wooden crates' },
        { value: 'Class III', label: 'Class III Commodities', description: 'Wood, paper, or natural fiber products' },
        { value: 'Class IV', label: 'Class IV Commodities', description: 'Class I-III with significant plastic content' },
        { value: 'Cartoned Unexpanded Plastics', label: 'Cartoned Unexpanded Plastics' },
        { value: 'Cartoned Expanded Plastics', label: 'Cartoned Expanded Plastics' },
        { value: 'Uncartoned Unexpanded Plastics', label: 'Uncartoned Unexpanded Plastics' },
        { value: 'Uncartoned Expanded Plastics', label: 'Uncartoned Expanded Plastics' }
      ],
      required: true,
      conditional: (data) => !!data.storage_height_ft,
      helpText: 'Commodity classification determines protection density requirements.'
    },
    {
      id: 'system_type',
      type: 'radio',
      question: 'What type of sprinkler system will be used?',
      options: [
        { value: 'wet', label: 'Wet System', description: 'Water-filled pipes (most common, faster response)' },
        { value: 'dry', label: 'Dry System', description: 'Air-filled pipes (required in freezing conditions)' },
        { value: 'both', label: 'Both/Uncertain', description: 'Will evaluate both options for optimal design' }
      ],
      required: true,
      conditional: (data) => !!data.commodity_type?.length,
      helpText: 'System type affects response time and design requirements.'
    }
  ];

  const availableQuestions = questions.filter(q => 
    !q.conditional || q.conditional(formData)
  );
  const currentQuestions = availableQuestions.slice(currentStep, currentStep + 1);

  const handleInputChange = (questionId: keyof ASRSFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isCurrentStepValid = () => {
    const currentQuestion = currentQuestions[0];
    if (!currentQuestion) return false;
    
    const value = formData[currentQuestion.id];
    if (currentQuestion.required && (value === undefined || value === '')) return false;
    
    if (currentQuestion.validation) {
      const error = currentQuestion.validation(value);
      if (error) return false;
    }
    
    return true;
  };

  const nextStep = () => {
    if (currentStep < availableQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateDesign = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/fm-global/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        alert(`Error: Server returned ${response.status}. Please try again.`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const spec = result.specification;
        
        const designData = {
          applicable_figures: spec.applicableFigures,
          applicable_tables: spec.applicableTables,
          sprinkler_count: spec.sprinklerCount,
          protection_scheme: spec.protectionScheme,
          in_rack_required: spec.inRackProtection?.required,
          submission_id: result.submissionId
        };
        
        setDesignResult(designData);
      } else {
        alert(`Error: ${result.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error submitting form: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderQuestion = (question: FormQuestion) => {
    const value = formData[question.id];
    const error = question.validation ? question.validation(value) : null;

    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{question.question}</h3>
          {question.helpText && (
            <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
              💡 {question.helpText}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {question.type === 'select' && question.options && (
            <div className="grid gap-3">
              {question.options.map((option) => (
                <label
                  key={option.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    value === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      value === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {value === option.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {question.type === 'number' && (
            <div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={question.min}
                  max={question.max}
                  step={question.step}
                  value={value || ''}
                  onChange={(e) => handleInputChange(question.id, parseFloat(e.target.value))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder={`Enter ${question.question.toLowerCase()}`}
                />
                {question.unit && (
                  <span className="text-gray-500 font-medium">{question.unit}</span>
                )}
              </div>
              {question.min !== undefined && question.max !== undefined && (
                <div className="mt-2 text-sm text-gray-500">
                  Range: {question.min} - {question.max} {question.unit}
                </div>
              )}
            </div>
          )}

          {question.type === 'multiselect' && question.options && (
            <div className="grid gap-2">
              {question.options.map((option) => {
                const isSelected = Array.isArray(value) && (value as string[]).includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`block p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentArray = Array.isArray(value) ? value as string[] : [];
                        if (e.target.checked) {
                          handleInputChange(question.id, [...currentArray, option.value]);
                        } else {
                          handleInputChange(question.id, currentArray.filter(v => v !== option.value));
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'radio' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    value === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600">{option.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    );
  };

  const progress = ((currentStep + 1) / availableQuestions.length) * 100;

  if (designResult) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-green-900 mb-2">✅ Design Complete!</h2>
          <p className="text-green-700">Your ASRS sprinkler system design has been generated based on FM Global 8-34 requirements.</p>
          {designResult.submission_id && (
            <p className="text-sm text-green-600 mt-2">Submission ID: {designResult.submission_id}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Your Configuration</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">ASRS Type:</span> {formData.asrs_type}</div>
              <div><span className="font-medium">Container Type:</span> {formData.container_type}</div>
              <div><span className="font-medium">Rack Depth:</span> {formData.rack_depth_ft} ft</div>
              <div><span className="font-medium">Rack Spacing:</span> {formData.rack_spacing_ft} ft</div>
              <div><span className="font-medium">Ceiling Height:</span> {formData.ceiling_height_ft} ft</div>
              <div><span className="font-medium">Storage Height:</span> {formData.storage_height_ft} ft</div>
              <div><span className="font-medium">Commodity:</span> {formData.commodity_type?.join(', ')}</div>
              <div><span className="font-medium">System Type:</span> {formData.system_type}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">FM Global 8-34 Requirements</h3>
            <div className="space-y-3">
              <div><span className="font-medium">Applicable Figures:</span> {designResult.applicable_figures?.length > 0 ? designResult.applicable_figures.join(', ') : 'Standard configurations'}</div>
              <div><span className="font-medium">Applicable Tables:</span> {designResult.applicable_tables?.length > 0 ? designResult.applicable_tables.join(', ') : 'See FM Global 8-34'}</div>
              <div><span className="font-medium">Sprinkler Count:</span> {designResult.sprinkler_count} sprinklers</div>
              <div><span className="font-medium">Protection Scheme:</span> {designResult.protection_scheme}</div>
              {designResult.in_rack_required && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <span className="font-medium">⚠️ In-Rack Protection Required</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Report
          </button>
          <button
            onClick={() => {
              setDesignResult(null);
              setCurrentStep(0);
              setFormData({});
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            New Design
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ASRS Sprinkler System Requirements</h1>
        <p className="text-gray-600 mb-4">
          Answer these questions to determine your FM Global 8-34 compliance requirements and get an instant design estimate.
        </p>
        
        <div className="bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600">
          Step {currentStep + 1} of {availableQuestions.length}
        </div>
      </div>

      {currentQuestions.map(question => (
        <div key={question.id}>
          {renderQuestion(question)}
        </div>
      ))}

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {currentStep < availableQuestions.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!isCurrentStepValid()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={generateDesign}
            disabled={!isCurrentStepValid() || isGenerating}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Design...' : 'Generate Design & Quote'}
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <div className="font-medium text-blue-900">Analyzing FM Global 8-34 Requirements</div>
              <div className="text-sm text-blue-700">Searching applicable figures and tables...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}