
import React from 'react';

interface ApiKeyGuardProps {
  onSelectKey: () => void;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ onSelectKey }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">API Key Required</h1>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Gemini 3 Pro (Nano Banana Pro) requires you to use your own Google Cloud API Key. 
          Please select a key from a paid GCP project to continue.
        </p>
        
        <button
          onClick={onSelectKey}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span>Select API Key</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
        
        <p className="mt-6 text-[10px] text-slate-400">
          Make sure your project has billing enabled. 
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-600 hover:underline ml-1">
            View Billing Documentation
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyGuard;
