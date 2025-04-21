import React, { useState } from 'react';

interface AgentFormProps {
  onSubmit: (agentData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const AgentCreationForm: React.FC<AgentFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    role: initialData?.role || '',
    personality: initialData?.personality || '',
    specialization: initialData?.specialization || '',
    system_instructions: initialData?.system_instructions || '',
    examples: initialData?.examples || []
  });

  const [currentExample, setCurrentExample] = useState({ input: '', output: '' });
  const [showExampleForm, setShowExampleForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addExample = () => {
    if (currentExample.input.trim() === '' || currentExample.output.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { ...currentExample }]
    }));
    
    setCurrentExample({ input: '', output: '' });
    setShowExampleForm(false);
  };

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExample(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {initialData ? 'Edit Agent' : 'Create New Agent'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Researcher, Copywriter, Designer"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Research and Analysis, Content Creation"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Personality
          </label>
          <select
            name="personality"
            value={formData.personality}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select Personality</option>
            <option value="Analytical">Analytical</option>
            <option value="Creative">Creative</option>
            <option value="Friendly">Friendly</option>
            <option value="Professional">Professional</option>
            <option value="Technical">Technical</option>
            <option value="Persuasive">Persuasive</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Specialization (Optional)
          </label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Market Research, Technical Writing"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            System Instructions
          </label>
          <textarea
            name="system_instructions"
            value={formData.system_instructions}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Detailed instructions for how the agent should behave and respond..."
            required
          />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Examples ({formData.examples.length})
            </label>
            <button
              type="button"
              onClick={() => setShowExampleForm(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              + Add Example
            </button>
          </div>
          
          {formData.examples.length > 0 && (
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
              {formData.examples.map((example: any, index: number) => (
                <div key={index} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Input:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{example.input}</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Output:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{example.output}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showExampleForm && (
            <div className="mt-3 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Example</h4>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Input
                </label>
                <textarea
                  name="input"
                  value={currentExample.input}
                  onChange={handleExampleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="User input example..."
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Output
                </label>
                <textarea
                  name="output"
                  value={currentExample.output}
                  onChange={handleExampleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Expected agent response..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowExampleForm(false)}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addExample}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {initialData ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentCreationForm;
