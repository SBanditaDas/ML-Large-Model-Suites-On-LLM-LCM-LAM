/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Database, 
  Zap, 
  Send, 
  Loader2, 
  Terminal, 
  Cpu, 
  Layers,
  Search,
  Cloud,
  CheckCircle2,
  PlusCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { chatWithLLM, queryWithContext, executeAction } from './services/gemini';
import { Message, ModelType } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ModelType>('LLM');
  const [messages, setMessages] = useState<Record<ModelType, Message[]>>({
    LLM: [],
    LCM: [],
    LAM: []
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextText, setContextText] = useState('');
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() && activeTab !== 'LCM') return;
    if (activeTab === 'LCM' && !input.trim() && !contextText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], userMessage]
    }));
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      if (activeTab === 'LLM') {
        responseText = await chatWithLLM([...messages.LLM, userMessage]);
      } else if (activeTab === 'LCM') {
        responseText = await queryWithContext(contextText, input);
      } else if (activeTab === 'LAM') {
        const response = await executeAction(input);
        
        // Handle function calls
        if (response.functionCalls) {
          const calls = response.functionCalls;
          setActionLogs(prev => [...prev, ...calls]);
          
          // Simulate tool execution results
          const results = calls.map(call => {
            if (call.name === 'getWeather') return { location: call.args.location, temp: '22°C', condition: 'Sunny' };
            if (call.name === 'createTask') return { status: 'success', id: Math.random().toString(36).substr(2, 9) };
            if (call.name === 'searchWeb') return { results: [`Information about ${call.args.query}...`] };
            return { error: 'Unknown tool' };
          });

          // In a real LAM, we'd send these results back to the model to get a final response
          // For this demo, we'll just show the action was taken.
          responseText = response.text || "I've initiated the requested actions. You can see the details in the action logs.";
        } else {
          responseText = response.text || "No specific action was identified, but I'm ready to help.";
        }
      }

      const modelMessage: Message = {
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], modelMessage]
      }));
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        role: 'system',
        content: `Error: ${error.message || 'Something went wrong'}`,
        timestamp: Date.now()
      };
      setMessages(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { id: 'LLM', label: 'LLM', fullLabel: 'Large Language Model', icon: MessageSquare, desc: 'Reasoning & Creativity' },
    { id: 'LCM', label: 'LCM', fullLabel: 'Large Context Model', icon: Database, desc: 'Massive Data Processing' },
    { id: 'LAM', label: 'LAM', fullLabel: 'Large Action Model', icon: Zap, desc: 'Tool Use & Automation' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-emerald-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg sm:rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Large Model Suite</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ModelType)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-emerald-500 text-black shadow-lg" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.id}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Terminal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Tab Nav */}
      <nav className="md:hidden flex items-center justify-around bg-black/60 border-b border-white/5 p-2 sticky top-16 z-40 backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ModelType)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
              activeTab === tab.id ? "text-emerald-400" : "text-zinc-500"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.id}</span>
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 flex-1 min-h-0 overflow-hidden">
        {/* Sidebar / Info */}
        <div className={cn(
          "lg:col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar transition-all duration-300",
          isSidebarOpen ? "fixed inset-0 z-50 bg-[#0A0A0A] p-6 pt-24 lg:relative lg:inset-auto lg:p-0" : "hidden lg:block"
        )}>
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white bg-white/5 rounded-full lg:hidden"
            >
              <PlusCircle className="w-6 h-6 rotate-45" />
            </button>
          )}

          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              {React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-5 h-5" })}
              <h2 className="font-semibold">{activeTab} Mode</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {tabs.find(t => t.id === activeTab)!.desc}. 
              {activeTab === 'LLM' && " Use this for complex reasoning, creative writing, and general chat."}
              {activeTab === 'LCM' && " Paste large amounts of text below to query specific information within it."}
              {activeTab === 'LAM' && " Ask the model to perform tasks like checking weather or creating todos."}
            </p>
          </div>

          {activeTab === 'LCM' && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider px-2">Context Library</label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Paste your large context here..."
                className="w-full h-48 sm:h-64 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar"
              />
            </div>
          )}

          {activeTab === 'LAM' && actionLogs.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider px-2">Action Logs</label>
              <div className="space-y-2">
                {actionLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                      {log.name === 'getWeather' && <Cloud className="w-4 h-4 text-emerald-400" />}
                      {log.name === 'createTask' && <PlusCircle className="w-4 h-4 text-emerald-400" />}
                      {log.name === 'searchWeb' && <Search className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-zinc-300 truncate">{log.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{JSON.stringify(log.args)}</p>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
            <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Pro Tip
            </h3>
            <p className="text-xs text-zinc-400">
              {activeTab === 'LLM' && "Try asking for a complex architectural design or a philosophical debate."}
              {activeTab === 'LCM' && "You can paste an entire book chapter and ask for specific character motivations."}
              {activeTab === 'LAM' && "Try: 'Check the weather in Tokyo and then create a task to pack my umbrella.'"}
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-9 flex flex-col bg-white/5 border border-white/5 rounded-3xl sm:rounded-[2.5rem] overflow-hidden relative flex-1 min-h-0">
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar"
          >
            {messages[activeTab].length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 opacity-40 px-4">
                <div className="p-4 sm:p-6 bg-white/5 rounded-full">
                  <Cpu className="w-8 h-8 sm:w-12 sm:h-12" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Ready to process</h3>
                  <p className="text-xs sm:text-sm">Start a conversation or provide context to see the power of the {activeTab} in action.</p>
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages[activeTab].map((msg, idx) => (
                <motion.div
                  key={msg.timestamp + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-3xl",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-emerald-500 text-black" : "bg-white/10 text-emerald-400"
                  )}>
                    {msg.role === 'user' ? <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                  <div className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-50" 
                      : "bg-white/5 border border-white/10 text-zinc-300",
                    msg.role === 'system' && "bg-red-500/10 border-red-500/20 text-red-400 w-full max-w-none"
                  )}>
                    <div className="markdown-body overflow-x-auto">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex gap-3 sm:gap-4 max-w-3xl mr-auto animate-pulse">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-400" />
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-zinc-500 italic text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 sm:p-6 bg-black/40 border-t border-white/5 backdrop-blur-md shrink-0">
            <div className="relative max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={activeTab === 'LCM' ? "Ask a question..." : "Type your message..."}
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-4 sm:pl-6 pr-12 sm:pr-16 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && activeTab !== 'LCM')}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-emerald-500 text-black rounded-lg sm:rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4 sm:w-5 h-5" />
              </button>
            </div>
            <p className="text-[9px] sm:text-[10px] text-center text-zinc-600 mt-3 sm:mt-4 uppercase tracking-widest font-mono">
              Built by SBD
            </p>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.3);
        }
        .markdown-body p { margin-bottom: 1rem; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; }
      `}} />
    </div>
  );
}
