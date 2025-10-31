import React from 'react';
import { GithubIcon } from './icons/GithubIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <GithubIcon className="h-8 w-8 text-sky-400" />
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI README Generator</h1>
        </div>
      </nav>
    </header>
  );
};

export default Header;
