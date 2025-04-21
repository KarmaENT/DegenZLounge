import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, UsersIcon, BeakerIcon, CogIcon } from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">DeGeNz Lounge</h1>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-2">
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
          >
            <HomeIcon className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/agents"
            className="flex items-center px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
          >
            <UsersIcon className="w-5 h-5 mr-3" />
            <span>Agent Library</span>
          </Link>
          <Link
            to="/sandbox/new"
            className="flex items-center px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
          >
            <BeakerIcon className="w-5 h-5 mr-3" />
            <span>Sandbox</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
          >
            <CogIcon className="w-5 h-5 mr-3" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-sidebar-accent rounded-full"></div>
          <div className="ml-3">
            <p className="text-sm font-medium text-sidebar-foreground">User Name</p>
            <p className="text-xs text-sidebar-foreground opacity-70">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
