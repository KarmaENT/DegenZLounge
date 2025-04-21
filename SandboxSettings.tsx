import React, { useState } from 'react';

interface SandboxSettingsProps {
  mode: string;
  setMode: (mode: string) => void;
  conflictResolution: string;
  setConflictResolution: (resolution: string) => void;
  sessionName: string;
  setSessionName: (name: string) => void;
}

const SandboxSettings: React.FC<SandboxSettingsProps> = ({
  mode,
  setMode,
  conflictResolution,
  setConflictResolution,
  sessionName,
  setSessionName
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Session Settings</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Manager Mode
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="collaborative">Collaborative</option>
          <option value="strict">Strict</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {mode === 'collaborative' 
            ? 'Agents will work together with minimal oversight' 
            : 'Manager will strictly assign tasks to specific agents'}
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Session Name
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="Enter session name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Conflict Resolution
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          value={conflictResolution}
          onChange={(e) => setConflictResolution(e.target.value)}
        >
          <option value="manager">Manager Decision</option>
          <option value="voting">Agent Voting</option>
          <option value="user">User Override</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {conflictResolution === 'manager' 
            ? 'Manager agent will resolve conflicts between agents' 
            : conflictResolution === 'voting'
              ? 'Agents will vote to resolve conflicts'
              : 'You will be asked to resolve conflicts manually'}
        </p>
      </div>
      
      <div className="mt-6">
        <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SandboxSettings;
