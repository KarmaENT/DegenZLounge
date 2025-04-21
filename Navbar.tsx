import React, { useState } from 'react';
import { BellIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">DeGeNz Lounge</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>
          <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none">
            <BellIcon className="h-6 w-6" />
          </button>
          <div className="relative">
            <button className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
