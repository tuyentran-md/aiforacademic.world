"use client";
import React from 'react';

export default function CanvasPanel({ activeView }: { activeView: string }) {
  return (
    <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50/50">
      {activeView === 'idle' && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-2 shadow-sm">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <p className="text-lg font-medium text-slate-500">Workspace đã sẵn sàng</p>
          <p className="text-sm">Hãy nhập yêu cầu vào ô chat bên trái để AI bắt đầu làm việc.</p>
        </div>
      )}

      {activeView === 'references' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-800">Tài liệu tìm được</h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold">2 kết quả</span>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-blue-700 text-lg">[ref-001] Outcomes of cleft palate repair: a systematic review</h3>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
            </div>
            <p className="text-sm text-slate-500 mb-3">Smith J, et al. · Journal of Plastic Surgery · 2023 · Cited: 45</p>
            <div className="bg-slate-50/50 p-3 rounded text-sm text-slate-700 border border-slate-100 leading-relaxed">
              <span className="font-semibold text-slate-900">Abstract:</span> Background: Cleft palate repair remains one of the most common craniofacial surgical procedures. This study aims to evaluate the long-term outcomes...
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-blue-700 text-lg">[ref-002] Microsurgical free flap reconstruction in pediatric patients</h3>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
            </div>
            <p className="text-sm text-slate-500 mb-3">Nguyen A, et al. · Microsurgery · 2024 · Cited: 12</p>
            <div className="bg-slate-50/50 p-3 rounded text-sm text-slate-700 border border-slate-100 leading-relaxed">
              <span className="font-semibold text-slate-900">Abstract:</span> Free tissue transfer in the pediatric population presents unique challenges. We reviewed 50 consecutive cases...
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 flex items-center space-x-2 transition-colors">
              <span>✍️ Gợi ý: Viết Bản thảo từ tài liệu này</span>
            </button>
          </div>
        </div>
      )}

      {activeView === 'editor' && (
        <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Bản thảo (Manuscript Draft)</h2>
            <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition-colors flex items-center shadow-sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Chạy kiểm tra RIC
            </button>
          </div>
          <div className="flex-1 bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-800 overflow-y-auto outline-none" contentEditable suppressContentEditableWarning>
            <h1 className="text-3xl font-bold mb-6 font-sans text-slate-900">Đánh giá kết quả phẫu thuật tạo hình vòm miệng</h1>
            <h2 className="text-xl font-bold mt-8 mb-4 font-sans text-slate-700">1. Đặt vấn đề</h2>
            <p className="mb-4 text-justify">
              Khe hở vòm miệng là một trong những dị tật bẩm sinh vùng hàm mặt phổ biến nhất, ảnh hưởng đến khoảng 1 trên 700 trẻ sơ sinh trên toàn thế giới <span className="text-blue-600 font-sans cursor-pointer text-base bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors inline-block select-none">[ref-001]</span>. 
              Mục tiêu chính của phẫu thuật tạo hình vòm miệng là phục hồi chức năng phát âm bình thường, đồng thời giảm thiểu tác động đến sự phát triển của xương hàm trên.
            </p>
            <h2 className="text-xl font-bold mt-8 mb-4 font-sans text-slate-700">2. Phương pháp</h2>
            <p className="mb-4 text-slate-400 italic font-sans text-base flex items-center">
              (AI đang tiếp tục sinh nội dung phần này...)
              <span className="inline-block w-1.5 h-4 ml-2 bg-slate-400 animate-pulse rounded-sm"></span>
            </p>
          </div>
        </div>
      )}

      {activeView === 'integrity' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-800">Báo cáo Kiểm chứng (RIC Integrity)</h2>
            <div className="flex space-x-2">
              <span className="bg-red-50 text-red-700 text-sm px-3 py-1.5 rounded-full font-bold shadow-sm border border-red-200 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Điểm: 78/100
              </span>
            </div>
          </div>
          
          <div className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-800">
            <h1 className="text-3xl font-bold mb-6 font-sans text-slate-900">Đánh giá kết quả phẫu thuật tạo hình vòm miệng</h1>
            <h2 className="text-xl font-bold mt-8 mb-4 font-sans text-slate-700">1. Đặt vấn đề</h2>
            <p className="mb-4 text-justify">
              Khe hở vòm miệng là một trong những dị tật bẩm sinh vùng hàm mặt phổ biến nhất, ảnh hưởng đến khoảng 
              <span className="bg-red-50 border-b-2 border-red-400 mx-1 pb-0.5 inline-block relative group cursor-pointer text-red-900 font-medium">
                1 trên 700
                <span className="absolute top-full left-0 mt-2 w-72 p-4 bg-white border border-red-200 shadow-xl rounded-xl text-sm font-sans text-slate-700 z-10 hidden group-hover:block transition-all">
                  <strong className="text-red-700 flex items-center mb-2 text-base">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01"></path></svg>
                    Lỗi trích dẫn (Statistic)
                  </strong>
                  Tài liệu [ref-001] ghi nhận tỷ lệ là &quot;1 trên 600-800 tuỳ thuộc vào chủng tộc&quot;. Con số 1/700 không hoàn toàn chính xác theo source.
                  <div className="mt-3 flex gap-2">
                    <button className="bg-red-50 text-red-700 px-2.5 py-1 rounded border border-red-200 font-medium hover:bg-red-100 transition-colors">Sửa tự động</button>
                    <button className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded border border-slate-200 font-medium hover:bg-slate-100 transition-colors">Bỏ qua</button>
                  </div>
                </span>
              </span> 
              trẻ sơ sinh trên toàn thế giới <span className="text-blue-600 font-sans cursor-pointer text-base bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 inline-block select-none">[ref-001]</span>. 
            </p>
            <p className="mb-4 text-justify">
              Tỷ lệ thành công của các phương pháp phẫu thuật hiện đại đạt 
              <span className="bg-yellow-50 border-b-2 border-yellow-400 mx-1 pb-0.5 inline-block relative group cursor-pointer text-yellow-900 font-medium">
                hơn 95%
                <span className="absolute top-full left-0 mt-2 w-72 p-4 bg-white border border-yellow-200 shadow-xl rounded-xl text-sm font-sans text-slate-700 z-10 hidden group-hover:block transition-all">
                  <strong className="text-yellow-700 flex items-center mb-2 text-base">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Cảnh báo (Overclaiming)
                  </strong>
                  Không có tài liệu nào trong danh sách hỗ trợ con số &quot;hơn 95%&quot;. Cần bổ sung nguồn hoặc điều chỉnh lại câu văn.
                </span>
              </span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
