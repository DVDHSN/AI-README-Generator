
import React, { useState, useCallback } from 'react';
import { generateReadme } from '../services/geminiService';
import { GithubIcon } from './icons/GithubIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

const ReadmeGenerator: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedReadme('');
    try {
      const readme = await generateReadme(repoUrl, isThinkingMode);
      setGeneratedReadme(readme);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [repoUrl, isThinkingMode]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedReadme).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Input Section */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <GithubIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repository"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors duration-200"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>{isLoading ? 'Generating...' : 'Generate README'}</span>
          </button>
        </div>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        <div className="mt-4 flex items-center justify-end">
          <label htmlFor="thinking-mode" className="flex items-center cursor-pointer">
            <span className="mr-3 text-sm font-medium text-slate-300">Enable Thinking Mode</span>
            <div className="relative">
              <input 
                type="checkbox" 
                id="thinking-mode" 
                className="sr-only" 
                checked={isThinkingMode}
                onChange={() => setIsThinkingMode(!isThinkingMode)}
                disabled={isLoading}
              />
              <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isThinkingMode ? 'translate-x-6 bg-sky-400' : ''}`}></div>
            </div>
          </label>
        </div>
      </div>

      {/* Output Section */}
      <div className="flex-grow bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
            <p className="mt-4 text-lg">Gemini is thinking...</p>
            <p className="text-sm">This might take a moment, especially in Thinking Mode.</p>
          </div>
        ) : generatedReadme ? (
          <div className="relative h-full">
            <button
              onClick={handleCopyToClipboard}
              className="absolute top-3 right-3 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors"
            >
              <ClipboardIcon className="h-5 w-5" />
              {copySuccess && <span className="absolute -left-2 top-10 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
            </button>
            <pre className="w-full h-full p-6 font-mono text-sm overflow-auto whitespace-pre-wrap text-slate-200">
              <code>{generatedReadme}</code>
            </pre>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>Your generated README will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadmeGenerator;
