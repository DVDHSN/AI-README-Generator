
import React from 'react';
import { GithubIcon } from './icons/GithubIcon';

interface HeaderProps {
  activeTab: 'generator' | 'chatbot';
  setActiveTab: (tab: 'generator' | 'chatbot') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tabName: 'generator' | 'chatbot') => {
    return `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-sky-500 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <GithubIcon className="h-8 w-8 text-sky-400" />
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI README Generator</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
          <button onClick={() => setActiveTab('generator')} className={getTabClass('generator')}>
            Generator
          </button>
          <button onClick={() => setActiveTab('chatbot')} className={getTabClass('chatbot')}>
            Chat Bot
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
