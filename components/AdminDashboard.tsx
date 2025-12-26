
import React, { useState } from 'react';
import { AwardTemplate, Recipient, ROLE_SUGGESTIONS, AwardPreset } from '../types.ts';
import { CertificateDesigner } from './CertificateDesigner.tsx';
import { db, doc, setDoc } from '../firebaseConfig.ts';

interface AdminDashboardProps {
  templates: AwardTemplate[];
  recipients: Record<string, Recipient[]>;
  presets: AwardPreset[];
  onSaveTemplate: (template: AwardTemplate) => void;
  onAddRecipient: (recipient: Recipient) => void;
  onDeleteRecipient: (recipientId: string, templateId: string) => void;
  onSavePreset: (text: string) => void;
  onDeletePreset: (id: string) => void;
  isCloud: boolean;
}

type ViewMode = 'LIST' | 'CREATE_DESIGN' | 'MANAGE_RECIPIENTS' | 'MANAGE_PRESETS' | 'ACCOUNT_SETTINGS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    templates, 
    recipients, 
    presets,
    onSaveTemplate, 
    onAddRecipient,
    onDeleteRecipient,
    onSavePreset,
    onDeletePreset,
    isCloud
}) => {
  const [view, setView] = useState<ViewMode>('LIST');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AwardTemplate | undefined>(undefined);
  const [recipientForm, setRecipientForm] = useState({
      name: '',
      role: 'นักเรียน',
      customDesc: '',
  });
  const [accountForm, setAccountForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [newP, setNewP] = useState('');

  const startCreate = () => { setEditingTemplate(undefined); setView('CREATE_DESIGN'); };
  const startEdit = (template: AwardTemplate) => { setEditingTemplate(template); setView('CREATE_DESIGN'); };
  const startManage = (templateId: string) => { 
      setSelectedTemplateId(templateId); 
      setView('MANAGE_RECIPIENTS'); 
      setRecipientForm({ name: '', role: 'นักเรียน', customDesc: '' }); 
  };

  const handleSaveDesign = (template: AwardTemplate) => { 
    onSaveTemplate(template); 
    setView('LIST'); 
  };

  const handleAddRecipientLocal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTemplateId || !recipientForm.name) return;

      const currentTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!currentTemplate) return;

      const now = new Date();
      const thaiYear = now.getFullYear() + 543;
      const yearSuffix = `/${thaiYear}`;
      
      // เลขที่เริ่มต้นจาก Template หรือ 1
      const startFrom = currentTemplate.startNumber || 1;
      let maxSeq = startFrom - 1; // ตั้งค่าเริ่มต้นให้รันต่อจาก startFrom

      const currentList = recipients[selectedTemplateId] || [];
      currentList.forEach(r => {
          if (r.runningNumber?.endsWith(yearSuffix)) {
              const seq = parseInt(r.runningNumber.split('/')[0]);
              if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
          }
      });

      const nextSeq = maxSeq + 1;
      const runningNumber = `${nextSeq}${yearSuffix}`;

      onAddRecipient({
          id: Date.now().toString(),
          templateId: selectedTemplateId,
          name: recipientForm.name,
          role: recipientForm.role,
          runningNumber: runningNumber,
          customDescription: recipientForm.customDesc || undefined
      });

      setRecipientForm(prev => ({ ...prev, name: '' })); 
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.password !== accountForm.confirmPassword) { alert('รหัสผ่านไม่ตรงกัน'); return; }
    if (isCloud && db) {
      try {
        await setDoc(doc(db, 'config', 'admin'), { username: accountForm.username, password: accountForm.password });
        alert('อัปเดตบัญชีสำเร็จ');
        setView('LIST');
      } catch (err) { alert('อัปเดตไม่สำเร็จ: ' + (err as Error).message); }
    }
  };

  const exportSystemData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      schoolGroup: "Muang Nang Rong School Group",
      templates,
      recipients,
      presets
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MNR_Backup_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (view === 'CREATE_DESIGN') {
      return <CertificateDesigner initialTemplate={editingTemplate} onSave={handleSaveDesign} onCancel={() => setView('LIST')} />;
  }

  if (view === 'MANAGE_RECIPIENTS') {
      const currentTemplate = templates.find(t => t.id === selectedTemplateId);
      const currentRecipients = (recipients[selectedTemplateId!] || []).sort((a,b) => {
          const seqA = parseInt(a.runningNumber.split('/')[0]) || 0;
          const seqB = parseInt(b.runningNumber.split('/')[0]) || 0;
          return seqB - seqA;
      });

      if (!currentTemplate) return <div>ไม่พบรูปแบบเกียรติบัตร</div>;

      return (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-lg border border-slate-200 no-print">
                  <button onClick={() => setView('LIST')} className="bg-slate-950 text-white px-5 py-2 rounded-xl font-black text-[9px] hover:bg-slate-800 transition-all flex items-center shadow-md border-b-2 border-slate-900 uppercase">
                      <i className="fas fa-arrow-left mr-2"></i> กลับหน้าหลัก
                  </button>
                  <div className="text-right">
                    <h2 className="text-lg font-black text-slate-950">{currentTemplate.name}</h2>
                    <p className="text-[9px] text-blue-700 font-black mt-1 uppercase italic tracking-widest">{currentTemplate.projectName}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 no-print">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 sticky top-5">
                      <h3 className="text-xs font-black mb-5 flex items-center text-slate-950 uppercase tracking-widest">
                        <span className="w-7 h-7 bg-blue-700 text-white rounded-lg flex items-center justify-center mr-3 shadow-md">
                          <i className="fas fa-user-plus text-[10px]"></i>
                        </span>
                        เพิ่มรายชื่อต่อเนื่อง
                      </h3>
                      <form onSubmit={handleAddRecipientLocal} className="space-y-5">
                          <div>
                              <label className="block text-[9px] font-black text-slate-950 uppercase mb-2">ชื่อ - นามสกุล</label>
                              <input type="text" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value})} className="w-full border-2 border-slate-200 bg-slate-50 p-3.5 rounded-xl text-sm font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="พิมพ์ชื่อแล้วกด Enter..." required autoFocus />
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-slate-950 uppercase mb-2">ตำแหน่ง</label>
                              <input list="role-suggestions" value={recipientForm.role} onChange={e => setRecipientForm({...recipientForm, role: e.target.value})} className="w-full border-2 border-slate-200 bg-slate-50 p-3.5 rounded-xl text-sm font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all" />
                              <datalist id="role-suggestions">{ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}</datalist>
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-slate-950 uppercase mb-2">รางวัลที่คุณครูเลือก</label>
                              <textarea value={recipientForm.customDesc} onChange={e => setRecipientForm({...recipientForm, customDesc: e.target.value})} className="w-full border-2 border-slate-200 bg-slate-50 p-3.5 rounded-xl text-sm font-bold text-slate-950 focus:bg-white focus:border-blue-600 outline-none transition-all min-h-[80px]" rows={3} placeholder="เลือกจากรายการด้านล่างหรือพิมพ์เอง..." />
                              
                              <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[8px] font-black text-blue-800 uppercase mb-2">คลิกเลือกรางวัล:</p>
                                <div className="flex flex-wrap gap-2">
                                  {presets.map(p => (
                                    <button key={p.id} type="button" onClick={() => setRecipientForm({...recipientForm, customDesc: p.text})} className="px-2 py-1 bg-white border border-slate-200 hover:border-blue-700 hover:text-blue-700 rounded-lg text-[9px] font-bold transition-all shadow-sm active:scale-95">{p.text}</button>
                                  ))}
                                </div>
                              </div>
                          </div>
                          <button type="submit" className="w-full bg-blue-700 text-white py-3.5 rounded-xl hover:bg-blue-800 shadow-lg font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all mt-1 border-b-4 border-blue-950 flex items-center justify-center">
                              <i className="fas fa-plus-circle mr-2"></i> บันทึกรายชื่อ
                          </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
                            <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">รายชื่อผู้รับเกียรติบัตร ({currentRecipients.length})</h3>
                            <button onClick={() => window.print()} className="bg-emerald-700 text-white px-5 py-2 rounded-lg font-black text-[9px] hover:bg-emerald-800 active:scale-95 transition-all shadow-md border-b-2 border-emerald-900 uppercase">
                                <i className="fas fa-print mr-2"></i> พิมพ์ / ดาวน์โหลด PDF
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y border-t border-slate-50">
                              <thead className="bg-white">
                                  <tr>
                                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-950 uppercase">เลขที่</th>
                                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-950 uppercase">ชื่อ - นามสกุล</th>
                                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-950 uppercase">รางวัลที่ได้รับ</th>
                                      <th className="px-6 py-4 text-right text-[9px] font-black text-slate-950 uppercase no-print">จัดการ</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white divide-y border-b border-slate-50">
                                  {currentRecipients.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">ยังไม่มีรายชื่อ</td></tr>
                                  ) : (
                                    currentRecipients.map((recipient) => (
                                      <tr key={recipient.id} className="hover:bg-slate-50/50 transition-all group">
                                          <td className="px-6 py-4 text-xs font-bold text-slate-700">{recipient.runningNumber}</td>
                                          <td className="px-6 py-4">
                                            <span className="text-sm font-black text-slate-950 block">{recipient.name}</span>
                                            <span className="text-[8px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold mt-1 inline-block uppercase border border-slate-200">{recipient.role}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <p className="text-xs text-slate-600 line-clamp-1">{recipient.customDescription || '-'}</p>
                                          </td>
                                          <td className="px-6 py-4 text-right no-print">
                                              <button onClick={() => { if(confirm('ต้องการลบรายชื่อนี้ใช่หรือไม่?')) onDeleteRecipient(recipient.id, selectedTemplateId!); }} className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-300 hover:text-rose-700 hover:border-rose-400 transition-all shadow-sm">
                                                  <i className="fas fa-trash-alt text-[10px]"></i>
                                              </button>
                                          </td>
                                      </tr>
                                    ))
                                  )}
                              </tbody>
                          </table>
                        </div>
                    </div>
                  </div>
              </div>
          </div>
      );
  }
  
  if (view === 'ACCOUNT_SETTINGS') {
      return (
        <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-16">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
             <div className="text-center mb-10">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-cog text-2xl"></i>
                </div>
                <h2 className="text-xl font-black text-slate-950">ตั้งค่าบัญชีแอดมิน</h2>
             </div>
             <form onSubmit={handleUpdateAccount} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-3">Username ใหม่</label>
                  <input type="text" required className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value})} placeholder="ป้อนชื่อผู้ใช้งานใหม่" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-3">Password ใหม่</label>
                  <input type="password" required className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={accountForm.password} onChange={e => setAccountForm({...accountForm, password: e.target.value})} placeholder="ป้อนรหัสผ่านใหม่" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-3">ยืนยัน Password</label>
                  <input type="password" required className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={accountForm.confirmPassword} onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})} placeholder="ยืนยันรหัสผ่านอีกครั้ง" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setView('LIST')} className="flex-1 px-6 py-4 rounded-xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">ยกเลิก</button>
                  <button type="submit" className="flex-[2] bg-slate-950 text-white py-4 rounded-xl font-black text-[10px] hover:bg-blue-700 shadow-xl border-b-4 border-slate-900 uppercase tracking-widest transition-all">บันทึก</button>
                </div>
             </form>
          </div>
        </div>
      );
  }

  if (view === 'MANAGE_PRESETS') {
      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-500">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">ตั้งค่ารายการรางวัล</h3>
                 <button onClick={() => setView('LIST')} className="text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors">ปิด</button>
              </div>
              <div className="flex gap-3 mb-8">
                 <input type="text" className="flex-grow border-2 border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-700" value={newP} onChange={e => setNewP(e.target.value)} placeholder="พิมพ์ชื่อรางวัลใหม่..." />
                 <button onClick={() => { if(newP) { onSavePreset(newP); setNewP(''); } }} className="bg-blue-700 text-white px-8 rounded-xl font-black text-[10px] uppercase shadow-lg border-b-2 border-blue-900">เพิ่ม</button>
              </div>
              <div className="space-y-2">
                 {presets.map(p => (
                   <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-bold text-slate-900">{p.text}</span>
                      <button onClick={() => onDeletePreset(p.id)} className="text-rose-300 hover:text-rose-700 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16 no-print">
      <div className="flex flex-col md:flex-row justify-between items-end gap-5 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none">แผงควบคุม</h2>
            <p className="text-blue-800 mt-2 font-black uppercase tracking-widest text-[9px] italic">School Administrator Dashboard</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <button onClick={exportSystemData} className="bg-white text-emerald-700 border-2 border-emerald-100 px-5 py-2.5 rounded-xl shadow-sm hover:bg-emerald-50 transition-all font-black text-[9px] flex items-center uppercase"><i className="fas fa-file-export mr-2"></i> สำรองข้อมูล (JSON)</button>
              <button onClick={() => setView('ACCOUNT_SETTINGS')} className="bg-white text-slate-900 px-5 py-2.5 rounded-xl shadow-md hover:bg-slate-50 transition-all font-black text-[9px] flex items-center border-b-2 border-slate-200 uppercase"><i className="fas fa-user-shield mr-2 text-slate-400"></i> ตั้งค่าบัญชี</button>
              <button onClick={() => setView('MANAGE_PRESETS')} className="bg-slate-950 text-white px-5 py-2.5 rounded-xl shadow-md hover:bg-slate-800 transition-all font-black text-[9px] flex items-center border-b-2 border-slate-900 uppercase"><i className="fas fa-tasks mr-2 text-blue-400"></i> ตั้งค่ารางวัล</button>
              <button onClick={startCreate} className="bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-blue-800 transition-all font-black text-[9px] flex items-center border-b-2 border-blue-900 uppercase"><i className="fas fa-plus-circle mr-2"></i> สร้างใหม่</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
              <div key={template.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300 hover:border-blue-600">
                  <div className="h-40 bg-slate-200 overflow-hidden relative">
                      <img src={template.backgroundImage || 'https://via.placeholder.com/400x300?text=MNR'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={template.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/95 px-3 py-1 rounded-lg text-[9px] font-black shadow-md text-slate-950 border border-slate-100 flex items-center">
                          <i className="fas fa-users mr-1.5 text-blue-700"></i> {recipients[template.id]?.length || 0} รายชื่อ
                        </span>
                      </div>
                  </div>
                  <div className="p-6 flex-grow">
                      <h3 className="font-black text-base text-slate-950 line-clamp-1 tracking-tight">{template.name}</h3>
                      <p className="text-[9px] text-slate-600 mt-1.5 font-bold uppercase tracking-widest italic line-clamp-1">"{template.projectName}"</p>
                  </div>
                  <div className="bg-slate-50 p-4 flex gap-2 border-t border-slate-100">
                      <button onClick={() => startManage(template.id)} className="flex-[2] bg-blue-700 text-white text-[9px] font-black py-2.5 rounded-lg hover:bg-blue-800 transition-all uppercase tracking-widest shadow-sm border-b-2 border-blue-900">จัดการรายชื่อ</button>
                      <button onClick={() => startEdit(template)} className="flex-1 bg-white border border-slate-300 text-[9px] font-black text-slate-950 py-2.5 rounded-lg hover:bg-slate-100 transition-all uppercase tracking-widest">ดีไซน์</button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
