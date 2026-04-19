"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ onViewChange }: { onViewChange: (view: any) => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'agent', text: 'Chào sếp! Em là AFA Assistant. Sếp cần tìm tài liệu, lên dàn ý (AVR), hay soát lỗi bài viết (RIC)?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    
    // Fake typing delay
    setTimeout(() => {
      let agentReply = '';
      if (userText.toLowerCase().includes('tìm') || userText.toLowerCase().includes('search') || userText.toLowerCase().includes('tài liệu')) {
        agentReply = 'Em đã gọi PubMed và OpenAlex, tìm được 2 tài liệu sát nhất. Sếp xem list bên Canvas nhé.';
        onViewChange('references');
      } else if (userText.toLowerCase().includes('viết') || userText.toLowerCase().includes('draft') || userText.toLowerCase().includes('avr')) {
        agentReply = 'Tiếp nhận lệnh. Em đang ráp dàn ý và viết bản nháp từ tài liệu đã chọn. Sếp xem trực tiếp bên Editor.';
        onViewChange('editor');
      } else if (userText.toLowerCase().includes('check') || userText.toLowerCase().includes('lỗi') || userText.toLowerCase().includes('ric')) {
        agentReply = 'Đã quét qua RIC Audit. Phát hiện vài lỗi trích dẫn và logic overclaim, em highlight đỏ bên Canvas rồi nhé.';
        onViewChange('integrity');
      } else {
        agentReply = 'Đã ghi nhận. Sếp cần làm gì tiếp theo cứ bảo em.';
      }
      setMessages(prev => [...prev, { role: 'agent', text: agentReply }]);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col p-4 justify-between h-full bg-white">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="relative mt-2">
        <textarea 
          className="w-full border border-slate-300 rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          rows={2}
          placeholder="Nhập yêu cầu (VD: Tìm tài liệu về vạt da...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
        />
        <button type="submit" className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
