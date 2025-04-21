import React, { useState } from 'react';
import AgentCard from '../components/agents/AgentCard';

interface Agent {
  id: number;
  name: string;
  role: string;
  personality: string;
  specialization?: string;
  system_instructions: string;
  examples?: Array<{input: string, output: string}>;
}

const AgentLibrary: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 1,
      name: 'Researcher',
      role: 'Research and Analysis',
      personality: 'Analytical',
      specialization: 'Market Research',
      system_instructions: 'You are a research specialist who excels at gathering and analyzing information.'
    },
    {
      id: 2,
      name: 'Copywriter',
      role: 'Content Creation',
      personality: 'Creative',
      specialization: 'Marketing Copy',
      system_instructions: 'You are a creative copywriter who specializes in persuasive marketing content.'
    },
    {
      id: 3,
      name: 'Designer',
      role: 'Visual Design',
      personality: 'Artistic',
      specialization: 'Packaging Design',
      system_instructions: 'You are a visual designer who creates compelling packaging and branding.'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleDragStart = (e: React.DragEvent, agentId: number) => {
    e.dataTransfer.setData('agentId', agentId.toString());
  };

  const handleAgentClick = (agentId: number) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Library</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          Create New Agent
        </button>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search agents..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map(agent => (
          <AgentCard
            key={agent.id}
            id={agent.id}
            name={agent.name}
            role={agent.role}
            personality={agent.personality}
            specialization={agent.specialization}
            onDragStart={handleDragStart}
            onClick={handleAgentClick}
          />
        ))}
      </div>
      
      {filteredAgents.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No agents found. Try a different search term or create a new agent.</p>
        </div>
      )}
    </div>
  );
};

export default AgentLibrary;
