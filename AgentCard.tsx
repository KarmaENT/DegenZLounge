import React from 'react';

interface AgentCardProps {
  id: number;
  name: string;
  role: string;
  personality: string;
  specialization?: string;
  onDragStart: (e: React.DragEvent, agentId: number) => void;
  onClick: (agentId: number) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  id,
  name,
  role,
  personality,
  specialization,
  onDragStart,
  onClick
}) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onClick={() => onClick(id)}
    >
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{role}</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center mb-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-24">Personality:</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{personality}</span>
        </div>
        {specialization && (
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-24">Specialization:</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{specialization}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
          Agent
        </span>
      </div>
    </div>
  );
};

export default AgentCard;
