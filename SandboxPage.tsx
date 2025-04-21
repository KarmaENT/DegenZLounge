import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

interface Message {
  id: number;
  content: string;
  sender: string;
  senderType: 'user' | 'agent' | 'manager';
  timestamp: string;
  agentId?: number;
}

interface Agent {
  id: number;
  name: string;
  role: string;
}

const SandboxPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: 'Welcome to the sandbox! How can I help you today?',
      sender: 'Manager Agent',
      senderType: 'manager',
      timestamp: new Date().toISOString()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [activeAgents, setActiveAgents] = useState<Agent[]>([
    { id: 1, name: 'Researcher', role: 'Research and Analysis' },
    { id: 2, name: 'Copywriter', role: 'Content Creation' }
  ]);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const agentId = e.dataTransfer.getData('agentId');
    console.log(`Agent ${agentId} dropped into sandbox`);
    // In a real implementation, we would fetch the agent details and add to activeAgents
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const sendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: 'User',
      senderType: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');
    
    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: messages.length + 2,
        content: 'I\'m processing your request. Let me analyze this...',
        sender: 'Manager Agent',
        senderType: 'manager',
        timestamp: new Date().toISOString()
      };
      setMessages(prevMessages => [...prevMessages, agentResponse]);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sandbox {id === 'new' ? 'Session' : `#${id}`}
        </h1>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none">
            Save Session
          </button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none">
            Export Results
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 space-x-4 overflow-hidden">
        {/* Left Panel - Active Agents */}
        <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Active Agents</h2>
          {activeAgents.map(agent => (
            <div key={agent.id} className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{agent.role}</p>
                </div>
              </div>
            </div>
          ))}
          <div 
            className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Drag agents here</p>
          </div>
        </div>
        
        {/* Center Panel - Chat */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`mb-4 ${message.senderType === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block max-w-3/4 px-4 py-2 rounded-lg ${
                    message.senderType === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : message.senderType === 'manager'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {message.senderType !== 'user' && (
                    <p className="text-xs font-semibold mb-1">{message.sender}</p>
                  )}
                  <p>{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Settings */}
        <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Session Settings</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Manager Mode
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
              <option value="collaborative">Collaborative</option>
              <option value="strict">Strict</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter session name"
              defaultValue={id === 'new' ? '' : `Session ${id}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conflict Resolution
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
              <option value="manager">Manager Decision</option>
              <option value="voting">Agent Voting</option>
              <option value="user">User Override</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxPage;
