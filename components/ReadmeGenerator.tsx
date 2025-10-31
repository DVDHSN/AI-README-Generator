import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateReadme, editReadmeSelection } from '../services/geminiService';
import { getRepoContent } from '../services/githubService';
import { GithubIcon } from './icons/GithubIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ExportIcon } from './icons/ExportIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { InfoIcon } from './icons/InfoIcon';
import { KeyIcon } from './icons/KeyIcon';

const ReadmeGenerator: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedReadme('');
    setSelection(null);
    
    try {
      const repoContent = await getRepoContent(repoUrl, githubToken, setLoadingMessage);
      
      setLoadingMessage('Generating README with Gemini...');
      const readme = await generateReadme(repoUrl, repoContent, isThinkingMode);
      setGeneratedReadme(readme);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [repoUrl, isThinkingMode, githubToken]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedReadme).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd, value } = e.currentTarget;
    if (selectionStart !== selectionEnd) {
      setSelection({
        start: selectionStart,
        end: selectionEnd,
        text: value.substring(selectionStart, selectionEnd),
      });
    } else {
      setSelection(null);
      setEditPrompt('');
    }
  };

  const handleEdit = async () => {
    if (!selection || !editPrompt) return;

    setIsEditing(true);
    setError(null);

    try {
      const editedText = await editReadmeSelection(selection.text, editPrompt);
      
      const newReadme = 
        generatedReadme.substring(0, selection.start) + 
        editedText + 
        generatedReadme.substring(selection.end);
      
      setGeneratedReadme(newReadme);
      
      setSelection(null);
      setEditPrompt('');

    } catch (err: any) {
      setError(err.message || 'Failed to edit selection.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleExport = async (format: 'md' | 'txt' | 'pdf' | 'docx') => {
    setIsExportMenuOpen(false);
    const filename = 'README';

    const triggerDownload = (blob: Blob, extension: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (format === 'md' || format === 'txt') {
        const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
        const blob = new Blob([generatedReadme], { type: mimeType });
        triggerDownload(blob, format);
    } else if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const margin = 10;
        const pageHeight = doc.internal.pageSize.getHeight();
        const lines = doc.splitTextToSize(generatedReadme, doc.internal.pageSize.getWidth() - margin * 2);
        
        let y = margin;
        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        
        for (const line of lines) {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 5; 
        }
        doc.save(`${filename}.pdf`);
    } else if (format === 'docx') {
        const { marked } = await import('marked');
        const htmlToDocx = (await import('html-to-docx')).default;
        
        const htmlString = await marked.parse(generatedReadme);
        const styledHtml = `
          <!DOCTYPE html><html><head><style>
            body { font-family: sans-serif; font-size: 11pt; }
            pre { background-color: #f0f0f0; padding: 1em; border-radius: 5px; font-family: monospace; }
            code { font-family: monospace; background-color: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px;}
          </style></head><body>${htmlString}</body></html>
        `;

        const fileBuffer = await htmlToDocx(styledHtml);
        triggerDownload(fileBuffer as Blob, 'docx');
    }
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
            {isLoading ? <SpinnerIcon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
            <span>{isLoading ? 'Generating...' : 'Generate README'}</span>
          </button>
        </div>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label htmlFor="private-repo" className="flex items-center cursor-pointer">
              <span className="text-sm font-medium text-slate-300 mr-3">Private Repo</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="private-repo" 
                  className="sr-only" 
                  checked={showTokenInput}
                  onChange={() => setShowTokenInput(!showTokenInput)}
                  disabled={isLoading}
                />
                <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showTokenInput ? 'translate-x-6 bg-sky-400' : ''}`}></div>
              </div>
            </label>
            <label htmlFor="thinking-mode" className="flex items-center cursor-pointer">
              <div className="flex items-center gap-1.5 mr-3">
                <span className="text-sm font-medium text-slate-300">Enable Thinking Mode</span>
                <div className="relative group flex items-center">
                  <InfoIcon className="h-4 w-4 text-slate-400" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-20 mb-2 w-64 p-2 text-xs text-center bg-slate-700 text-slate-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 invisible group-hover:visible pointer-events-none">
                    Enables a larger processing budget for Gemini, potentially leading to more in-depth analysis but may take longer.
                  </div>
                </div>
              </div>
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
        {showTokenInput && (
          <div className="mt-4 animate-fade-in">
              <label htmlFor="github-token" className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-300">
                  GitHub Personal Access Token
                  <div className="relative group flex items-center">
                      <InfoIcon className="h-4 w-4 text-slate-400" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-20 mb-2 w-72 p-2 text-xs text-left bg-slate-700 text-slate-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 invisible group-hover:visible pointer-events-none">
                          Provide a PAT to access private repositories. Your token is not stored and is only used for this session. Ensure the token has 'repo' scope.
                          <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline ml-1">Create one here.</a>
                      </div>
                  </div>
              </label>
              <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                      type="password"
                      id="github-token"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors duration-200"
                      disabled={isLoading}
                  />
              </div>
          </div>
        )}
      </div>

      {/* AI Edit Selection Bar */}
      {selection && (
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-sky-500/30 shadow-lg animate-fade-in">
          <p className="text-sm font-medium text-sky-300 mb-2">Edit selected text</p>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-grow w-full">
              <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g., 'Make this more concise' or 'Fix grammar'"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors duration-200"
                disabled={isEditing}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <button
              onClick={handleEdit}
              disabled={isEditing || !editPrompt.trim()}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isEditing && <SpinnerIcon className="h-5 w-5" />}
              <span>{isEditing ? 'Rewriting...' : 'Rewrite'}</span>
            </button>
             <button
              onClick={() => { setSelection(null); setEditPrompt(''); }}
              disabled={isEditing}
              className="w-full md:w-auto bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="mt-3 bg-slate-900/50 p-2 border border-slate-700 rounded-md max-h-20 overflow-y-auto">
            <p className="text-xs text-slate-400 italic whitespace-pre-wrap">"{selection.text}"</p>
          </div>
        </div>
      )}

      {/* Output Section */}
      <div className="flex-grow bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
            <SpinnerIcon className="h-12 w-12 text-sky-400" />
            <p className="mt-4 text-lg">{loadingMessage}</p>
            {loadingMessage.includes('Gemini') && (
              <p className="text-sm">This might take a moment, especially in Thinking Mode.</p>
            )}
          </div>
        ) : generatedReadme ? (
          <div className="relative h-full flex-grow">
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <div ref={exportMenuRef} className="relative">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors"
                  aria-label="Export README"
                >
                  <ExportIcon className="h-5 w-5" />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-md shadow-lg py-1 animate-fade-in">
                    <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Markdown (.md)</button>
                    <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Text (.txt)</button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">PDF (.pdf)</button>
                    <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Word (.docx)</button>
                  </div>
                )}
              </div>
              <button
                onClick={handleCopyToClipboard}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors"
                aria-label="Copy to clipboard"
              >
                <ClipboardIcon className="h-5 w-5" />
                {copySuccess && <span className="absolute -left-2 top-10 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
              </button>
            </div>
            <textarea
              onSelect={handleSelect}
              value={generatedReadme}
              onChange={(e) => setGeneratedReadme(e.target.value)}
              className="w-full h-full p-6 pt-16 font-mono text-sm bg-transparent text-slate-200 resize-none outline-none absolute inset-0"
              spellCheck="false"
              aria-label="Generated README content"
            />
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