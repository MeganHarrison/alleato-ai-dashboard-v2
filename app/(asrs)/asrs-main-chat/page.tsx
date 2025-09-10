import React, { useState, useEffect } from 'react';
import { useFMGlobalApp } from './hooks/useFMGlobal';

const CompleteASRSApplication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'form' | 'results'>('chat');
  const [designResult, setDesignResult] = useState(null);
  
  const {
    chat,
    design,
    form,
    search,
    optimization,
    lead
  } = useFMGlobalApp();

  // Initialize with welcome message
  useEffect(() => {
    if (chat.messages.length === 0) {
      // Add initial welcome message
      const welcomeMessage = {
        role: 'assistant' as const,
        content: `👋 **Welcome to the FM Global 8-34 ASRS Expert System**

I can help you with:
• **Quick Chat** - Ask questions about FM Global 8-34 requirements
• **Design Form** - Complete system design with cost estimates
• **Code Compliance** - Verify requirements and get optimization suggestions

**Popular Questions:**
- What are the sprinkler spacing requirements for my ASRS?
- How do I determine the applicable figures and tables?
- What's the difference between wet and dry system requirements?
- How can I optimize my design for cost savings?

What would you like to explore first?`,
        timestamp: new Date(),
        sources: [],
        figures_referenced: [],
        tables_referenced: []
      };
    }
  }, [chat.messages.length]);

  const handleFormCompletion = async () => {
    try {
      const result = await form.submitForm();
      if (result) {
        setDesignResult(result.design);
        setActiveTab('results');
        
        // Also send a summary to chat
        const configSummary = Object.entries(form.formData)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
        
        await chat.sendMessage(`I just completed the design form with configuration: ${configSummary}. Can you provide a summary of the key requirements and any optimization opportunities?`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderTabButton = (tab: string, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
      {tab === 'form' && form.progress > 0 && (
        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(form.progress)}%
        </span>
      )}
    </button>
  );

  const renderChatInterface = () => (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-4xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>
              </div>
              
              {/* Message bubble */}
              <div className={`rounded-2xl px-6 py-4 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <div 
                  className={`${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/•\s/g, '• ')
                      .replace(/\n/g, '<br />')
                  }}
                />
                
                {/* References */}
                {message.figures_referenced && message.figures_referenced.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">📊 Referenced Figures:</div>
                    <div className="flex flex-wrap gap-2">
                      {message.figures_referenced.map(figNum => (
                        <span key={figNum} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Figure {figNum}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {message.tables_referenced && message.tables_referenced.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600 mb-2">📋 Referenced Tables:</div>
                    <div className="flex flex-wrap gap-2">
                      {message.tables_referenced.map(tableNum => (
                        <span key={tableNum} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Table {tableNum}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs mt-3 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {chat.isLoading && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold mr-3">
                AI
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Analyzing FM Global requirements...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {chat.suggestions.length > 0 && !chat.isLoading && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 self-center">💡 Try asking:</span>
            {chat.suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => chat.sendMessage(suggestion)}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const message = formData.get('message') as string;
          if (message.trim()) {
            chat.sendMessage(message);
            (e.target as HTMLFormElement).reset();
          }
        }}>
          <div className="flex space-x-4">
            <input
              name="message"
              type="text"
              placeholder="Ask about FM Global 8-34 requirements, design optimization, or specific technical questions..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={chat.isLoading}
            />
            <button
              type="submit"
              disabled={chat.isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderFormInterface = () => (
    <div className="p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">ASRS System Configuration</h2>
          <span className="text-sm text-gray-600">
            Step {form.currentStep + 1} of {form.questions.length}
          </span>
        </div>
        
        <div className="bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${form.progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600">
          {Math.round(form.progress)}% Complete
        </div>
      </div>

      {/* Current Question */}
      {form.currentQuestion && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {form.currentQuestion.label}
          </h3>

          {form.currentQuestion.type === 'select' && (
            <div className="space-y-3">
              {form.currentQuestion.options?.map((option) => (
                <label
                  key={option.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    form.formData[form.currentQuestion.key as keyof typeof form.formData] === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={form.currentQuestion.key}
                    value={option.value}
                    checked={form.formData[form.currentQuestion.key as keyof typeof form.formData] === option.value}
                    onChange={(e) => form.updateField(form.currentQuestion.key as any, e.target.value)}
                    className="sr-only"
                  />
                  <div className="font-medium text-gray-900">{option.label}</div>
                </label>
              ))}
            </div>
          )}

          {form.currentQuestion.type === 'number' && (
            <div>
              <input
                type="number"
                min={form.currentQuestion.min}
                max={form.currentQuestion.max}
                step={form.currentQuestion.step}
                value={form.formData[form.currentQuestion.key as keyof typeof form.formData] || ''}
                onChange={(e) => form.updateField(form.currentQuestion.key as any, parseFloat(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder={`Enter ${form.currentQuestion.label.toLowerCase()}`}
              />
              {form.currentQuestion.min !== undefined && form.currentQuestion.max !== undefined && (
                <div className="mt-2 text-sm text-gray-500">
                  Range: {form.currentQuestion.min} - {form.currentQuestion.max}
                </div>
              )}
            </div>
          )}

          {form.currentQuestion.type === 'multiselect' && (
            <div className="space-y-2">
              {form.currentQuestion.options?.map((option) => {
                const currentValue = form.formData[form.currentQuestion.key as keyof typeof form.formData] as string[] || [];
                const isSelected = currentValue.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`block p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          form.updateField(form.currentQuestion.key as any, [...currentValue, option.value]);
                        } else {
                          form.updateField(form.currentQuestion.key as any, currentValue.filter(v => v !== option.value));
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{option.label}</div>
                  </label>
                );
              })}
            </div>
          )}

          {form.errors[form.currentQuestion.key] && (
            <div className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              ⚠️ {form.errors[form.currentQuestion.key]}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={form.prevStep}
          disabled={form.currentStep === 0}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {form.currentStep < form.questions.length - 1 ? (
          <button
            onClick={form.nextStep}
            disabled={!form.isCurrentStepValid}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleFormCompletion}
            disabled={!form.isCurrentStepValid || form.isSubmitting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.isSubmitting ? 'Generating Design...' : 'Generate Design & Quote'}
          </button>
        )}
      </div>
    </div>
  );

  const renderResults = () => {
    if (!designResult) return <div>No results available</div>;

    return (
      <div className="p-6 space-y-6">
        {/* Success Header */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-2">✅ Design Complete!</h2>
          <p className="text-green-700">Your ASRS sprinkler system design has been generated based on FM Global 8-34 requirements.</p>
        </div>

        {/* Design Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4">Design Specifications</h3>
            <div className="space-y-3">
              <div><span className="font-medium">Protection Scheme:</span> {designResult.protection_scheme}</div>
              <div><span className="font-medium">Sprinkler Count:</span> {designResult.sprinkler_count} sprinklers</div>
              <div><span className="font-medium">Sprinkler Spacing:</span> {designResult.sprinkler_spacing}ft</div>
              <div><span className="font-medium">Applicable Figures:</span> {designResult.applicable_figures.map(f => f.figure_number).join(', ')}</div>
              <div><span className="font-medium">Applicable Tables:</span> {designResult.applicable_tables.map(t => t.table_number).join(', ')}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4">Cost Estimate</h3>
            <div className="space-y-2">
              {designResult.estimated_cost.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>${item.total.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Estimated Cost</span>
                <span>${designResult.estimated_cost.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Opportunities */}
        {designResult.optimization_opportunities.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4">💡 Cost Optimization Opportunities</h3>
            <div className="space-y-4">
              {designResult.optimization_opportunities.map((opt, index) => (
                <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-yellow-900">{opt.description}</h4>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm">
                      Save ${opt.estimated_savings.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800">{opt.requirements_impact}</p>
                  <div className="mt-2 text-xs text-yellow-700">
                    Feasibility: <span className="font-medium">{opt.feasibility}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold mb-4">📋 FM Global Compliance</h3>
          <div className="whitespace-pre-line text-gray-700">{designResult.compliance_summary}</div>
          <div className="mt-4">
            <h4 className="font-medium mb-2">References:</h4>
            <div className="flex flex-wrap gap-2">
              {designResult.fm_global_references.map((ref, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                  {ref}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📄 Download Report
          </button>
          <button
            onClick={() => {
              setDesignResult(null);
              form.resetForm();
              setActiveTab('form');
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 New Design
          </button>
          <button
            onClick={() => {
              // Switch to chat and ask about the design
              setActiveTab('chat');
              chat.sendMessage('Can you explain the design requirements and help me understand the optimization opportunities?');
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            💬 Discuss with AI
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alleato ASRS Expert</h1>
            <p className="text-gray-600">FM Global 8-34 Compliance & Cost Optimization Platform</p>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Online</span>
            </div>
            <span>•</span>
            <span>Database: 47 Figures, 46 Tables</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-4">
          {renderTabButton('chat', 'AI Chat', '💬')}
          {renderTabButton('form', 'Design Form', '📋')}
          {renderTabButton('results', 'Results', '📊')}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && renderChatInterface()}
        {activeTab === 'form' && renderFormInterface()}
        {activeTab === 'results' && renderResults()}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Powered by FM Global 8-34 Database • Real-time AI Analysis • Cost Optimization
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={chat.clearMessages}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Chat
            </button>
            <button 
              onClick={form.resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              Reset Form
            </button>
            <button 
              onClick={() => {
                // Lead generation modal could be triggered here
                console.log('Lead generation triggered');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Get Quote
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(chat.error || design.error || form.isSubmitting && !design.isGenerating) && (
        <div className="fixed bottom-20 right-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span className="text-sm">
              {chat.error || design.error || 'Processing...'}
            </span>
            <button 
              onClick={() => {
                // Clear errors
                if (chat.error) chat.clearMessages();
                if (design.error) design.clearDesign();
              }}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator for Form */}
      {form.isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Design</h3>
              <p className="text-gray-600 mb-4">
                Analyzing FM Global 8-34 requirements and generating your custom ASRS sprinkler design...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                <div className="text-sm text-blue-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Searching applicable figures and tables</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Calculating sprinkler requirements</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Generating cost estimates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">Identifying optimization opportunities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lead Generation Modal Component
const LeadGenerationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  designResult?: any;
  formData?: any;
}> = ({ isOpen, onClose, designResult, formData }) => {
  const [leadData, setLeadData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    project_description: '',
    estimated_timeline: '1-3 months'
  });

  const { lead } = useFMGlobalApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await lead.submitLead({
        ...leadData,
        configuration: formData,
        design_summary: designResult ? {
          sprinkler_count: designResult.sprinkler_count,
          estimated_cost: designResult.estimated_cost.total,
          protection_scheme: designResult.protection_scheme
        } : null
      });
      
      alert('Lead submitted successfully! Our team will contact you within 24 hours.');
      onClose();
    } catch (error) {
      console.error('Lead submission failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Get Your Custom Quote</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={leadData.company_name}
              onChange={(e) => setLeadData(prev => ({ ...prev, company_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name *
            </label>
            <input
              type="text"
              required
              value={leadData.contact_name}
              onChange={(e) => setLeadData(prev => ({ ...prev, contact_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={leadData.contact_email}
              onChange={(e) => setLeadData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={leadData.phone}
              onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Timeline
            </label>
            <select
              value={leadData.estimated_timeline}
              onChange={(e) => setLeadData(prev => ({ ...prev, estimated_timeline: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="immediate">Immediate (within 1 month)</option>
              <option value="1-3 months">1-3 months</option>
              <option value="3-6 months">3-6 months</option>
              <option value="6+ months">6+ months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description
            </label>
            <textarea
              value={leadData.project_description}
              onChange={(e) => setLeadData(prev => ({ ...prev, project_description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
              placeholder="Brief description of your ASRS project..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={lead.isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {lead.isSubmitting ? 'Submitting...' : 'Get Quote'}
            </button>
          </div>
        </form>

        {designResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Design Summary:</strong> {designResult.sprinkler_count} sprinklers, 
              {designResult.protection_scheme}, Est. ${designResult.estimated_cost.total.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteASRSApplication;
            