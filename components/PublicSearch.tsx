
import React, { useState, useMemo } from 'react';
import { AwardTemplate, Recipient } from '../types.ts';
import { CertificateRenderer } from './CertificateRenderer.tsx';

interface PublicSearchProps {
  templates: AwardTemplate[];
  recipients: Record<string, Recipient[]>;
}

export const PublicSearch: React.FC<PublicSearchProps> = ({ templates, recipients }) => {
  const [query, setQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<AwardTemplate | null>(null);
  const [selectedResult, setSelectedResult] = useState<{ template: AwardTemplate, recipient: Recipient } | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.projectName.toLowerCase().includes(q)
    );
  }, [query, templates]);

  const filteredRecipients = useMemo(() => {
    if (!selectedActivity) return [];
    const q = localQuery.toLowerCase().trim();
    const list = recipients[selectedActivity.id] || [];
    if (!q) return list;
    return list.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.runningNumber.toLowerCase().includes(q)
    );
  }, [localQuery, selectedActivity, recipients]);

  if (selectedResult) {
    return (
      <div className="flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500 pb-16">
        <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-xl no-print border-2 border-slate-200 gap-4">
            <button 
              onClick={() => setSelectedResult(null)} 
              className="w-full md:w-fit px-6 py-2.5 text-slate-950 font-black text-xs hover:bg-slate-100 rounded-xl transition-all border-2 border-slate-200 uppercase tracking-widest"
            >
                <i className="fas fa-arrow-left mr-2"></i> กลับ
            </button>
            <div className="text-center">
               <h4 className="font-black text-base text-slate-950 tracking-tight">เกียรติบัตรอิเล็กทรอนิกส์</h4>
               <p className="text-[9px] text-blue-700 font-black uppercase tracking-widest mt-0.5">Muang Nang Rong School Group</p>
            </div>
            <button 
              onClick={() => window.print()} 
              className="w-full md:w-fit bg-blue-700 text-white px-8 py-2.5 rounded-xl shadow-xl font-black text-xs active:scale-95 transition-all border-b-2 border-blue-950 uppercase tracking-widest"
            >
                <i className="fas fa-download mr-2"></i> Print / Download
            </button>
        </div>
        <div className="certificate-print-area shadow-2xl border-[12px] border-white rounded-xl bg-white overflow-hidden scale-[0.6] md:scale-0.9 lg:scale-100 origin-top shadow-slate-300">
             <CertificateRenderer template={selectedResult.template} recipient={selectedResult.recipient} />
        </div>
        <div className="no-print text-center bg-slate-950 text-white px-8 py-3.5 rounded-full border-b-2 border-slate-900 shadow-xl">
          <p className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center">
            <i className="fas fa-info-circle text-amber-500 mr-2"></i> ตั้งค่าการพิมพ์: แนวนอน (Landscape) และขอบ (None)
          </p>
        </div>
      </div>
    );
  }

  if (selectedActivity) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 rounded-[2rem] shadow-xl border-2 border-slate-200">
            <div className="flex items-center gap-5">
                <button 
                  onClick={() => setSelectedActivity(null)} 
                  className="bg-slate-950 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-all border-b-2 border-slate-900"
                >
                    <i className="fas fa-arrow-left text-sm"></i>
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight">{selectedActivity.name}</h2>
                  <p className="text-[10px] text-blue-800 font-black uppercase tracking-widest mt-0.5 italic">{selectedActivity.projectName}</p>
                </div>
            </div>
            <div className="relative group w-full md:w-[300px]">
                <input 
                    type="text"
                    placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                    className="w-full pl-10 pr-5 py-3 border-2 border-slate-300 bg-slate-50 rounded-xl text-base font-black text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all shadow-inner placeholder:text-slate-300"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                />
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors text-sm"></i>
            </div>
        </div>
        
        {filteredRecipients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipients.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedResult({ template: selectedActivity, recipient: r })}
                  className="bg-white p-6 rounded-[1.5rem] border-2 border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                   <div className="overflow-hidden">
                      <span className="text-lg font-black text-slate-950 block truncate group-hover:text-blue-600 transition-colors tracking-tight">{r.name}</span>
                      <span className="text-[9px] font-black text-indigo-800 mt-1.5 block uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg w-fit border border-indigo-100">ID: {r.runningNumber}</span>
                   </div>
                   <div className="shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-all shadow-sm active:scale-90">
                      <i className="fas fa-eye text-sm"></i>
                   </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-inner">
              <i className="fas fa-search text-3xl text-slate-200 mb-4"></i>
              <h3 className="text-lg font-black text-slate-950 uppercase tracking-widest">ไม่พบชื่อในระบบ</h3>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-16">
      <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border-4 border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
        
        <div className="mb-8 inline-flex p-5 bg-slate-950 rounded-2xl text-white shadow-xl relative border-b-4 border-slate-900">
           <i className="fas fa-shield-alt text-3xl text-blue-400"></i>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black text-slate-950 mb-6 tracking-tight leading-none">ระบบรับเกียรติบัตร</h2>
        <p className="text-slate-800 text-base md:text-lg mb-10 max-w-2xl mx-auto font-bold leading-relaxed">
          ป้อนชื่อโครงการที่คุณเข้าร่วม <br className="hidden md:block" />
          เพื่อรับใบประกาศเกียรติบัตรฉบับดิจิทัล
        </p>
        
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-3 bg-blue-600 rounded-[2.5rem] opacity-5 blur-2xl group-focus-within:opacity-15 transition-opacity"></div>
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-blue-700 transition-colors"></i>
          <input
            type="text"
            className="w-full pl-16 pr-8 py-5 border-2 border-slate-200 bg-slate-50 rounded-[1.5rem] text-slate-950 text-xl font-black focus:border-blue-700 focus:bg-white outline-none transition-all shadow-xl relative placeholder:text-slate-300 placeholder:font-bold"
            placeholder="ค้นหาโครงการที่นี่..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div 
              key={template.id} 
              onClick={() => setSelectedActivity(template)}
              className="bg-white rounded-[2.5rem] shadow-lg border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-blue-700 hover:shadow-xl transition-all duration-500 group flex flex-col hover:-translate-y-2"
            >
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                 <img src={template.backgroundImage || 'https://via.placeholder.com/400x300?text=Certificate'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95" alt={template.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
                 <div className="absolute bottom-5 left-6">
                    <span className="bg-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center border-b-2 border-slate-200">
                      <i className="fas fa-users mr-2 text-blue-700"></i> {recipients[template.id]?.length || 0} ราย
                    </span>
                 </div>
              </div>
              <div className="p-8 flex-grow">
                 <h3 className="font-black text-xl text-slate-950 line-clamp-2 min-h-[3rem] leading-tight group-hover:text-blue-700 transition-colors tracking-tight">{template.name}</h3>
                 <div className="h-1 w-12 bg-blue-700 mt-4 group-hover:w-full transition-all duration-500 rounded-full"></div>
                 <p className="text-[10px] text-slate-700 mt-4 font-black uppercase tracking-widest leading-relaxed italic">"{template.projectName}"</p>
              </div>
              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">ตรวจสอบรายชื่อที่นี่</span>
                 <div className="w-9 h-9 bg-white border border-slate-200 text-blue-700 rounded-lg flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-all shadow-md">
                    <i className="fas fa-chevron-right text-xs"></i>
                 </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <h3 className="text-base font-black text-slate-400 uppercase tracking-[0.2em]">ไม่พบข้อมูลที่คุณค้นหา</h3>
            </div>
          )}
      </div>
    </div>
  );
};
