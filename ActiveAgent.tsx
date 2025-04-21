import React from 'react';

interface ActiveAgentProps {
  agent: {
    id: number;
    name: string;
    role: string;
  };
  onRemove?: (agentId: number) => void;
}

const ActiveAgent: React.FC<ActiveAgentProps> = ({ agent, onRemove }) => {
  return (
    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
            {agent.name.charAt(0)}
          </div>
          <div className="ml-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{agent.role}</p>
          </div>
        </div>
        {onRemove && (
          <button 
            onClick={() => onRemove(agent.id)}
            className="text-gray-500 hover:text-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveAgent;
