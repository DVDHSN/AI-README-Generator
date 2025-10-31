
import React, { useState } from 'react';
import Header from './components/Header';
import ReadmeGenerator from './components/ReadmeGenerator';
import ChatBot from './components/ChatBot';

type ActiveTab = 'generator' | 'chatbot';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex">
        {activeTab === 'generator' && <ReadmeGenerator />}
        {activeTab === 'chatbot' && <ChatBot />}
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
