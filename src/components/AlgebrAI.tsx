import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Loader2, BrainCircuit, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AlgebrAIProps {
  theme: 'light' | 'dark';
}

export const AlgebrAI = ({ theme }: AlgebrAIProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Use the environment variable for the API key
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API Key is missing. If you are running this locally, ensure GEMINI_API_KEY is set.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are AlgebrAI, a fast and precise math assistant. Solve problems using Markdown and LaTeX ($...$ or $$...$$). IMPORTANT: Do not repeat characters or words (no 'SISI' or 'PP'). Be extremely concise. One clear answer only.",
          temperature: 0,
          // Set thinking level to LOW to reduce response time (latency)
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      const aiResponse = response.text || "I couldn't generate a response. Please try again.";
      
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'ai' && lastMsg.content === aiResponse) {
          return prev;
        }
        return [...prev, { role: 'ai', content: aiResponse }];
      });
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMessage = error.message?.includes("API Key") 
        ? "API Key Error: Please make sure your Gemini API key is configured."
        : "AlgebrAI is having trouble connecting. Please try again in a moment.";
      
      setMessages(prev => [...prev, { role: 'ai', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col min-h-[400px] max-h-[600px] w-full">
      <div className={cn(
        "text-xs uppercase tracking-widest font-bold mb-4 flex items-center justify-between",
        isDark ? "text-zinc-600" : "text-zinc-400"
      )}>
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} /> AlgebrAI Solver
        </div>
        {messages.length > 0 && (
          <button 
            onClick={clearChat}
            className="hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto mb-6 space-y-6 scrollbar-hide px-1",
          isDark ? "text-zinc-300" : "text-zinc-700"
        )}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className={cn(
              "p-4 rounded-full",
              isDark ? "bg-zinc-800 text-orange-500" : "bg-white text-orange-600 shadow-sm"
            )}>
              <Sparkles size={32} />
            </div>
            <div>
              <h4 className={cn("font-bold text-lg", isDark ? "text-zinc-200" : "text-zinc-800")}>Fast Math Solver</h4>
              <p className={cn("text-sm mt-1", isDark ? "text-zinc-500" : "text-zinc-400")}>
                Ask me any math question for an instant, precise answer.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col w-full",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              {msg.role === 'user' ? (
                <div className={cn(
                  "px-4 py-2 rounded-2xl text-sm font-bold max-w-[85%] shadow-sm",
                  isDark ? "bg-zinc-800 text-white border border-zinc-700/50" : "bg-orange-500 text-white"
                )}>
                  {msg.content}
                </div>
              ) : (
                <div className={cn(
                  "markdown-body prose prose-sm max-w-none overflow-x-auto leading-relaxed w-full",
                  isDark ? "prose-invert" : "prose-zinc"
                )}>
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.content}
                  </Markdown>
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-orange-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs font-medium">AlgebrAI is calculating...</span>
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your math problem..."
          className={cn(
            "w-full border rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none h-20",
            isDark ? "bg-zinc-800/30 border-zinc-700 text-zinc-100 placeholder:text-zinc-700" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-300"
          )}
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={cn(
            "absolute right-3 bottom-3 p-3 rounded-xl transition-all",
            input.trim() && !isLoading ? "bg-orange-500 text-white shadow-lg" : "bg-zinc-700/20 text-zinc-500 cursor-not-allowed"
          )}
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  );
};