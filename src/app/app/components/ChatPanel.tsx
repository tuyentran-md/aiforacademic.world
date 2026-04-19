import React, { useState } from 'react';

export default function ChatPanel({ onViewChange }: { onViewChange: (view: any) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Simulate agent routing based on keywords
    if (input.includes('search') || input.includes('tìm')) onViewChange('references');
    else if (input.includes('draft') || input.includes('viết')) onViewChange('editor');
    else if (input.includes('check') || input.includes('lỗi')) onViewChange('integrity');
    
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 justify-between h-full">
      <div className="flex-1 overflow-y-auto mb-4 text-sm text-slate-600">
        {/* Chat History / Agent logs go here */}
        <p className="mb-2">Agent: Hello! I can search papers, draft manuscripts, or check integrity. What do you need?</p>
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <textarea 
          className="w-full border rounded-lg p-3 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Ask a question or give a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="absolute bottom-3 right-3 text-blue-500 font-semibold">Send</button>
      </form>
    </div>
  );
}
