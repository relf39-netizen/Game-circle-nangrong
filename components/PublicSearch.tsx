
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
                <i className="fas fa-print mr-2"></i> พิมพ์ / ดาวน์โหลด
            </button>
        </div>
        
        {/* คอนเทนเนอร์สำหรับการพิมพ์ (สอดคล้องกับ CSS @media print ใน index.html) */}
        <div className="certificate-print-area relative bg-white shadow-2xl rounded-xl overflow-hidden border-[12px] border-white scale-[0.6] md:scale-[0.9] lg:scale-100 origin-top print:scale-100 print:m-0 print:p-0 print:border-none print:shadow-none">
             <CertificateRenderer template={selectedResult.template} recipient={selectedResult.recipient} />
        </div>
        
        <div className="no-print text-center bg-slate-950 text-white px-8 py-3.5 rounded-full border-b-2 border-slate-900 shadow-xl">
          <p className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center">
            <i className="fas fa-info-circle text-amber-500 mr-2"></i> แนะนำ: ตั้งค่าเครื่องพิมพ์เป็น "แนวนอน" และ "ขอบกระดาษ: ไม่มี"
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
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors text-sm"></i>
                <input 
                    type="text"
                    placeholder="ค้นหารายชื่อ..."
                    className="w-full pl-10 pr-5 py-3 border-2 border-slate-200 bg-slate-50 rounded-xl text-base font-black text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all shadow-inner placeholder:text-slate-300"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                />
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
                      <span className="text-[9px] font-black text-indigo-800 mt-1.5 block uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg w-fit border border-indigo-100">เลขที่: {r.runningNumber}</span>
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-16">
      {/* ส่วนหัวใหม่ที่กะทัดรัด (Compact Header) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 border-slate-200 pb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-700 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl border-b-4 border-blue-900">
            <i className="fas fa-layer-group text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-none">รายการรับเกียรติบัตร</h2>
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.15em] mt-2">MNR Certificate Catalog</p>
          </div>
        </div>
        <div className="relative group w-full md:w-[400px]">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors"></i>
          <input
            type="text"
            className="w-full pl-12 pr-6 py-4 border-2 border-slate-100 bg-white rounded-[1.5rem] text-slate-950 text-sm font-black focus:border-blue-700 outline-none transition-all shadow-sm placeholder:text-slate-300 placeholder:font-bold"
            placeholder="ค้นหาโครงการที่ท่านเข้าร่วม..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ตารางแสดงรายการโครงการ */}
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
                      <i className="fas fa-users mr-2 text-blue-700"></i> {recipients[template.id]?.length || 0} รายชื่อ
                    </span>
                 </div>
              </div>
              <div className="p-8 flex-grow">
                 <h3 className="font-black text-xl text-slate-950 line-clamp-2 min-h-[3rem] leading-tight group-hover:text-blue-700 transition-colors tracking-tight">{template.name}</h3>
                 <div className="h-1.5 w-12 bg-blue-700 mt-4 group-hover:w-full transition-all duration-700 rounded-full"></div>
                 <p className="text-[10px] text-slate-600 mt-5 font-black uppercase tracking-widest leading-relaxed italic line-clamp-2">"{template.projectName}"</p>
              </div>
              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-700 uppercase tracking-widest transition-colors">ตรวจสอบรายชื่อ</span>
                 <div className="w-10 h-10 bg-white border border-slate-200 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700 transition-all shadow-md active:scale-90">
                    <i className="fas fa-arrow-right text-xs"></i>
                 </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-search text-3xl text-slate-200"></i>
               </div>
               <h3 className="text-lg font-black text-slate-400 uppercase tracking-[0.2em]">ไม่พบโครงการที่คุณค้นหา</h3>
            </div>
          )}
      </div>
    </div>
  );
};
