
import React, { useState, useMemo } from 'react';
import { AwardTemplate, Recipient, SchoolItem, DocumentItem, DocumentType } from '../types.ts';
import { CertificateRenderer } from './CertificateRenderer.tsx';

interface PublicSearchProps {
  templates: AwardTemplate[];
  recipients: Record<string, Recipient[]>;
  schools: SchoolItem[];
  documents: DocumentItem[];
}

export const PublicSearch: React.FC<PublicSearchProps> = ({ templates, recipients, schools, documents }) => {
  const [activeTab, setActiveTab] = useState<'CERTIFICATES' | 'DOCUMENTS'>('CERTIFICATES');
  const [query, setQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocumentType | ''>('');
  const [selectedActivity, setSelectedActivity] = useState<AwardTemplate | null>(null);
  const [selectedResult, setSelectedResult] = useState<{ template: AwardTemplate, recipient: Recipient } | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(t => {
      const nameMatch = t.name.toLowerCase().includes(q);
      const projectMatch = t.projectName.toLowerCase().includes(q);
      const recipientMatch = recipients[t.id]?.some(r => r.name.toLowerCase().includes(q));
      return nameMatch || projectMatch || recipientMatch;
    });
  }, [query, templates, recipients]);

  const filteredRecipients = useMemo(() => {
    if (!selectedActivity) return [];
    const q = localQuery.toLowerCase().trim();
    const list = recipients[selectedActivity.id] || [];
    return list.filter(r => {
      const matchQuery = q === '' || r.name.toLowerCase().includes(q) || r.runningNumber.toLowerCase().includes(q);
      const matchSchool = filterSchool === '' || r.school === filterSchool;
      return matchQuery && matchSchool;
    });
  }, [localQuery, filterSchool, selectedActivity, recipients]);

  const filteredDocs = useMemo(() => {
    const q = query.toLowerCase().trim();
    return documents.filter(d => {
      const matchQuery = q === '' || d.title.toLowerCase().includes(q);
      const matchType = filterDocType === '' || d.type === filterDocType;
      return matchQuery && matchType;
    });
  }, [query, filterDocType, documents]);

  const handleDownloadAction = (template: AwardTemplate, recipient: Recipient) => {
    if (recipient.pdfUrl) {
      window.open(recipient.pdfUrl, '_blank');
    } else {
      setSelectedResult({ template, recipient });
      setTimeout(() => { window.print(); }, 300);
    }
  };

  if (selectedResult) {
    return (
      <div className="flex flex-col items-center space-y-10 animate-in zoom-in-95 duration-500 pb-16">
        <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-xl no-print border-2 border-slate-200 gap-4">
            <button onClick={() => setSelectedResult(null)} className="w-full md:w-fit px-8 py-3 text-slate-950 font-black text-base hover:bg-slate-100 rounded-xl transition-all border-2 border-slate-200 uppercase tracking-widest"><i className="fas fa-arrow-left mr-2"></i> กลับ</button>
            <div className="text-center">
               <h4 className="font-black text-xl text-slate-950 tracking-tight">ตรวจสอบเกียรติบัตร</h4>
               <p className="text-xs text-blue-700 font-black uppercase tracking-widest mt-1">Muang Nang Rong School Group</p>
            </div>
            <button onClick={() => window.print()} className="w-full md:w-fit bg-blue-700 text-white px-10 py-3 rounded-xl shadow-xl font-black text-base active:scale-95 transition-all border-b-2 border-blue-950 uppercase tracking-widest"><i className="fas fa-print mr-2"></i> พิมพ์ / ดาวน์โหลด PDF</button>
        </div>
        <div className="certificate-print-area relative bg-white shadow-2xl rounded-xl overflow-hidden border-[12px] border-white scale-[0.6] md:scale-[0.9] lg:scale-100 origin-top print:scale-100 print:m-0 print:p-0 print:border-none print:shadow-none">
             <CertificateRenderer template={selectedResult.template} recipient={selectedResult.recipient} />
        </div>
      </div>
    );
  }

  if (selectedActivity) {
    return (
      <div className="space-y-10 animate-in slide-in-from-right-10 duration-500 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-200">
            <div className="flex items-center gap-6">
                <button onClick={() => { setSelectedActivity(null); setFilterSchool(''); }} className="bg-slate-950 w-14 h-14 rounded-xl shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-all border-b-2 border-slate-900"><i className="fas fa-arrow-left text-xl"></i></button>
                <div>
                  <h2 className="text-3xl font-black text-slate-950 tracking-tight leading-tight">{selectedActivity.name}</h2>
                  <p className="text-sm text-blue-800 font-black uppercase tracking-widest mt-1 italic">{selectedActivity.projectName}</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <select className="pl-5 pr-10 py-4 border-2 border-slate-200 bg-slate-50 rounded-xl text-base font-black text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
                    <option value="">-- โรงเรียนทั้งหมด --</option>
                    {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <div className="relative group w-full md:w-[300px]">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors text-lg"></i>
                    <input type="text" placeholder="ค้นหาชื่อ..." className="w-full pl-12 pr-6 py-4 border-2 border-slate-200 bg-slate-50 rounded-xl text-base font-black text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} />
                </div>
            </div>
        </div>
        {filteredRecipients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipients.map(r => (
                <div key={r.id} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 flex items-center justify-between group hover:border-blue-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                   <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-950 block truncate group-hover:text-blue-600 transition-colors tracking-tight">{r.name}</span>
                        {r.pdfUrl && <i className="fas fa-cloud-check text-emerald-500"></i>}
                      </div>
                      <div className="flex flex-wrap gap-2.5 mt-3">
                         <span className="text-[12px] font-black text-indigo-800 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{r.school || 'ไม่ระบุโรงเรียน'}</span>
                         <span className="text-[12px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{r.type || 'นักเรียน'}</span>
                      </div>
                   </div>
                   <div className="shrink-0 flex gap-3">
                      <button onClick={() => setSelectedResult({ template: selectedActivity, recipient: r })} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm"><i className="fas fa-eye text-lg"></i></button>
                      <button onClick={() => handleDownloadAction(selectedActivity, r)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg border-b-2 ${r.pdfUrl ? 'bg-emerald-600 border-emerald-900 text-white' : 'bg-blue-700 border-blue-950 text-white'}`}><i className={`fas ${r.pdfUrl ? 'fa-cloud-download-alt' : 'fa-file-pdf'} text-lg`}></i></button>
                   </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
              <i className="fas fa-search text-5xl text-slate-200 mb-5"></i>
              <h3 className="text-2xl font-black text-slate-950 uppercase tracking-widest">ไม่พบรายชื่อ</h3>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-16">
      <div className="flex justify-center">
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex gap-2">
              <button onClick={() => { setActiveTab('CERTIFICATES'); setQuery(''); }} className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'CERTIFICATES' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><i className="fas fa-certificate mr-2"></i> ระบบเกียรติบัตร</button>
              <button onClick={() => { setActiveTab('DOCUMENTS'); setQuery(''); }} className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'DOCUMENTS' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><i className="fas fa-file-invoice mr-2"></i> คลังเอกสารราชการ</button>
          </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 border-slate-200 pb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${activeTab === 'CERTIFICATES' ? 'bg-blue-700' : 'bg-amber-600'} text-white rounded-xl flex items-center justify-center shadow-lg border-b-4 ${activeTab === 'CERTIFICATES' ? 'border-blue-900' : 'border-amber-900'}`}>
            <i className={`fas ${activeTab === 'CERTIFICATES' ? 'fa-layer-group' : 'fa-folder-open'} text-2xl`}></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none">{activeTab === 'CERTIFICATES' ? 'รายการเกียรติบัตร' : 'คลังเอกสารราชการ'}</h2>
            <p className="text-sm text-slate-500 font-black uppercase tracking-widest mt-1.5">{activeTab === 'CERTIFICATES' ? 'MNR Certificate Catalog' : 'MNR Document Library'}</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            {activeTab === 'DOCUMENTS' && (
                <select className="pl-5 pr-10 py-4 border-2 border-slate-100 bg-white rounded-2xl text-slate-950 text-sm font-black focus:border-amber-600 outline-none transition-all shadow-sm" value={filterDocType} onChange={(e) => setFilterDocType(e.target.value as any)}>
                    <option value="">ทุกประเภท</option>
                    <option value="หนังสือ">หนังสือ</option>
                    <option value="คำสั่ง">คำสั่ง</option>
                    <option value="ประกาศ">ประกาศ</option>
                    <option value="วาระการประชุม">วาระการประชุม</option>
                </select>
            )}
            <div className="relative group w-full md:w-[400px]">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors text-lg"></i>
              <input type="text" className={`w-full pl-12 pr-6 py-4 border-2 border-slate-100 bg-white rounded-2xl text-slate-950 text-sm font-black focus:border-${activeTab === 'CERTIFICATES' ? 'blue' : 'amber'}-700 outline-none transition-all shadow-sm placeholder:text-slate-300`} placeholder={activeTab === 'CERTIFICATES' ? "ค้นหาชื่อผู้รับ หรือ โครงการ..." : "ค้นหาหัวข้อเอกสาร..."} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
        </div>
      </div>

      {activeTab === 'CERTIFICATES' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
                <div key={template.id} onClick={() => setSelectedActivity(template)} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden cursor-pointer hover:border-blue-700 hover:shadow-lg transition-all duration-300 group flex flex-col hover:-translate-y-2">
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                     <img src={template.backgroundImage || 'https://via.placeholder.com/400x300?text=Certificate'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95" alt={template.name} />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-40"></div>
                     <div className="absolute bottom-4 left-5">
                        <span className="bg-white/95 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md flex items-center border border-slate-50"><i className="fas fa-users mr-1.5 text-blue-700"></i> {recipients[template.id]?.length || 0}</span>
                     </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                     <h3 className="font-black text-base text-slate-950 line-clamp-2 leading-snug tracking-tight">{template.name}</h3>
                     <p className="text-[10px] text-slate-500 mt-4 font-black uppercase tracking-widest italic line-clamp-2">"{template.projectName}"</p>
                  </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ประเภท</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">หัวข้อเอกสารราชการ</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">ไฟล์แนบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-8 py-4 text-[11px] font-black text-slate-400 whitespace-nowrap">
                        {new Date(doc.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${doc.type === 'คำสั่ง' ? 'bg-rose-50 text-rose-600' : doc.type === 'ประกาศ' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <h4 className="font-black text-slate-900 text-sm leading-tight group-hover:text-blue-700 transition-colors">{doc.title}</h4>
                      </td>
                      <td className="px-8 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          {doc.files?.map((f, i) => (
                            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white border-2 border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-blue-700 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all shadow-sm">
                              <i className="fas fa-file-pdf"></i> ดาวน์โหลด
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDocs.length === 0 && (
                <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-sm">ไม่พบเอกสารที่ค้นหา</div>
              )}
            </div>
        </div>
      )}
    </div>
  );
};
