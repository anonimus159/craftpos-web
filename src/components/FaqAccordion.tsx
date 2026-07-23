"use client";

import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';

interface FaqProps {
  question: string;
  answer: string | React.ReactNode;
}

export default function FaqAccordion({ question, answer }: FaqProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-slate-800 pr-4">{question}</span>
        <div className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-indigo-100 text-indigo-600' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100 mt-2">
          {answer}
        </div>
      </div>
    </div>
  );
}
