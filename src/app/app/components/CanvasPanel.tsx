import React from 'react';

export default function CanvasPanel({ activeView }: { activeView: string }) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {activeView === 'idle' && (
        <div className="flex items-center justify-center h-full text-slate-400">
          <p>Your workspace is ready. Give the agent a task to begin.</p>
        </div>
      )}
      {activeView === 'references' && (
        <div className="bg-white p-6 rounded shadow-sm">
          <h2 className="text-xl font-bold mb-4">References</h2>
          <div className="space-y-4">
            <div className="border p-4 rounded bg-slate-50">
              <p className="font-semibold">[ref-001] Smith et al.</p>
              <p className="text-sm text-slate-600">Outcomes of cleft palate repair...</p>
            </div>
            {/* Action buttons appear dynamically */}
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              ✍️ Draft from these references
            </button>
          </div>
        </div>
      )}
      {activeView === 'editor' && (
        <div className="bg-white p-6 rounded shadow-sm h-full font-serif text-lg leading-relaxed">
          <h2 className="text-xl font-bold mb-4 font-sans text-slate-800">Manuscript Draft</h2>
          <p>Cleft palate is one of the most common congenital craniofacial anomalies [ref-001].</p>
        </div>
      )}
      {activeView === 'integrity' && (
        <div className="bg-white p-6 rounded shadow-sm h-full font-serif text-lg leading-relaxed relative">
          <div className="absolute top-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold font-sans">Score: 78/100</div>
          <h2 className="text-xl font-bold mb-4 font-sans text-slate-800">Integrity Report</h2>
          <p>
            Cleft palate is one of the most common congenital craniofacial anomalies affecting 
            <span className="bg-red-200 border-l-4 border-red-500 pl-1 mx-1">1 in 700</span> live births.
          </p>
        </div>
      )}
    </div>
  );
}
