import React from 'react';
import { Socket } from 'socket.io-client';

interface ChatMessageProps {
  message: {
    id: number;
    content: string;
    sender: string;
    senderType: 'user' | 'agent' | 'manager';
    timestamp: string;
    agentId?: number;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.senderType === 'user';
  const isManager = message.senderType === 'manager';
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div 
        className={`inline-block max-w-3/4 px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-indigo-600 text-white' 
            : isManager
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {!isUser && (
          <p className="text-xs font-semibold mb-1">{message.sender}</p>
        )}
        <p>{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
