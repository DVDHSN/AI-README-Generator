import React from 'react';
import Header from './components/Header';
import ReadmeGenerator from './components/ReadmeGenerator';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex">
        <ReadmeGenerator />
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
