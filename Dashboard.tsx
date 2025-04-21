import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Agent Library</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create and manage your AI agents with custom roles and personalities.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">3</span>
            <a href="/agents" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              View Agents →
            </a>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Active Sandboxes</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your ongoing agent collaboration sessions.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
            <a href="/sandbox/new" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              New Session →
            </a>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View your recent agent interactions and sessions.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">15</span>
            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              View Activity →
            </a>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agents
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Eco-Friendly Shoe Launch</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">3 agents</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Collaborative
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    2 hours ago
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <a href="/sandbox/1" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                      Open
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Marketing Campaign</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">2 agents</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Strict
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    1 day ago
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <a href="/sandbox/2" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                      Open
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Start</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Create an Agent</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Define custom AI agents with specific roles and personalities.
              </p>
              <a href="/agents" className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Create Agent →
              </a>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Start a Sandbox</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Create a new workspace for agent collaboration.
              </p>
              <a href="/sandbox/new" className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Start Sandbox →
              </a>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">View Documentation</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Learn how to use DeGeNz Lounge effectively.
              </p>
              <a href="#" className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                View Docs →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
