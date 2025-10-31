
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { getChatInstance } from '../services/geminiService';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatInstanceRef = useRef(getChatInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chatInstanceRef.current.sendMessageStream({ message: input });
      
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].parts[0].text = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <div className="w-full h-[80vh] flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
      {/* Message History */}
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500">
                  <BotIcon className="h-5 w-5 text-sky-400" />
                </div>
              )}
              <div
                className={`max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-slate-700 rounded-br-none'
                    : 'bg-slate-900/50 rounded-bl-none border border-slate-700'
                }`}
              >
                <p className="text-slate-200 whitespace-pre-wrap">{msg.parts[0].text}</p>
              </div>
               {msg.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
           {isLoading && messages[messages.length -1]?.role === 'user' && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500">
                  <BotIcon className="h-5 w-5 text-sky-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-900/50 rounded-bl-none border border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse delay-75"></span>
                  <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse delay-150"></span>
                  <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse delay-300"></span>
                </div>
              </div>
            </div>
           )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-sky-400 flex-shrink-0"/>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
