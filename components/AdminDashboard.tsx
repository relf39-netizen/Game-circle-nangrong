
import React, { useState, useEffect, useRef } from 'react';
import { AwardTemplate, Recipient, TYPE_OPTIONS, AwardPreset, SchoolItem, DocumentItem, DOCUMENT_TYPE_OPTIONS, DocumentType, AttachedFile } from '../types.ts';
import { CertificateDesigner } from './CertificateDesigner.tsx';
import { db, doc, setDoc } from '../firebaseConfig.ts';

// คอนฟิกูเรชัน Google Drive
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // แก้ไขเป็น Client ID ของคุณ
const DRIVE_FOLDER_ID = '1-YOUR-FOLDER-ID-HERE'; // ระบุ Folder ID ที่ต้องการบันทึกไฟล์
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface AdminDashboardProps {
  templates: AwardTemplate[];
  recipients: Record<string, Recipient[]>;
  presets: AwardPreset[];
  schools: SchoolItem[];
  documents: DocumentItem[];
  onSaveTemplate: (template: AwardTemplate) => void;
  onAddRecipient: (recipient: Recipient) => void;
  onDeleteRecipient: (recipientId: string, templateId: string) => void;
  onSavePreset: (text: string) => void;
  onDeletePreset: (id: string) => void;
  onSaveSchool: (name: string) => void;
  onDeleteSchool: (id: string) => void;
  onSaveDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  isCloud: boolean;
}

type ViewMode = 'LIST' | 'CREATE_DESIGN' | 'MANAGE_RECIPIENTS' | 'MANAGE_PRESETS' | 'MANAGE_SCHOOLS' | 'ACCOUNT_SETTINGS' | 'MANAGE_DOCUMENTS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    templates, 
    recipients, 
    presets,
    schools,
    documents,
    onSaveTemplate, 
    onAddRecipient,
    onDeleteRecipient,
    onSavePreset,
    onDeletePreset,
    onSaveSchool,
    onDeleteSchool,
    onSaveDocument,
    onDeleteDocument,
    isCloud
}) => {
  const savedView = localStorage.getItem('mnr_admin_view') as ViewMode || 'LIST';
  const savedTemplateId = localStorage.getItem('mnr_admin_selected_id');

  const [view, setView] = useState<ViewMode>(savedView);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(savedTemplateId);
  const [editingTemplate, setEditingTemplate] = useState<AwardTemplate | undefined>(undefined);
  const [inputMode, setInputMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [batchNames, setBatchNames] = useState('');
  
  const [recipientForm, setRecipientForm] = useState({
      name: '',
      type: 'นักเรียน',
      school: schools[0]?.name || '',
      customDesc: presets[0]?.text || '',
  });

  const [docForm, setDocForm] = useState<Omit<DocumentItem, 'id'>>({
    title: '',
    type: 'หนังสือ',
    date: new Date().toISOString().split('T')[0],
    files: [],
    description: ''
  });
  
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [accountForm, setAccountForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [newP, setNewP] = useState('');
  const [newS, setNewS] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const driveFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mnr_admin_view', view);
    if (selectedTemplateId) {
      localStorage.setItem('mnr_admin_selected_id', selectedTemplateId);
    } else {
      localStorage.removeItem('mnr_admin_selected_id');
    }
  }, [view, selectedTemplateId]);

  // เริ่มต้นการเชื่อมต่อ Google API
  useEffect(() => {
    if (view === 'MANAGE_DOCUMENTS') {
      const initGapi = () => {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          setIsDriveReady(true);
        });
      };

      const initGis = () => {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error !== undefined) throw response;
            setAccessToken(response.access_token);
          },
        });
        setTokenClient(client);
      };

      if ((window as any).gapi) initGapi();
      if ((window as any).google) initGis();
    }
  }, [view]);

  const startCreate = () => { setEditingTemplate(undefined); setView('CREATE_DESIGN'); };
  const startEdit = (template: AwardTemplate) => { setEditingTemplate(template); setView('CREATE_DESIGN'); };
  const startManage = (templateId: string) => { 
      setSelectedTemplateId(templateId); 
      setView('MANAGE_RECIPIENTS'); 
  };

  const handleSaveDesign = (template: AwardTemplate) => { 
    onSaveTemplate(template); 
    setView('LIST'); 
  };

  const generateRunningNumber = (templateId: string, currentTemplate: AwardTemplate) => {
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const yearSuffix = `/${thaiYear}`;
    const startFrom = currentTemplate.startNumber || 1;
    let maxSeq = startFrom - 1;

    const currentList = recipients[templateId] || [];
    currentList.forEach(r => {
        if (r.runningNumber?.endsWith(yearSuffix)) {
            const seq = parseInt(r.runningNumber.split('/')[0]);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
    });
    return `${maxSeq + 1}${yearSuffix}`;
  };

  const handleAddRecipientLocal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTemplateId || !recipientForm.name) return;
      const currentTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!currentTemplate) return;

      onAddRecipient({
          id: Date.now().toString() + Math.random(),
          templateId: selectedTemplateId,
          name: recipientForm.name.trim(),
          type: recipientForm.type,
          school: recipientForm.school,
          runningNumber: generateRunningNumber(selectedTemplateId, currentTemplate),
          customDescription: recipientForm.customDesc || undefined
      });

      setRecipientForm(prev => ({ ...prev, name: '' })); 
      nameInputRef.current?.focus();
  };

  const handleBatchAdd = () => {
    if (!selectedTemplateId || !batchNames.trim()) return;
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    if (!currentTemplate) return;

    const names = batchNames.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return;

    let lastSeq = -1;
    names.forEach((name, index) => {
      const now = new Date();
      const thaiYear = now.getFullYear() + 543;
      const yearSuffix = `/${thaiYear}`;
      const startFrom = currentTemplate.startNumber || 1;
      
      let maxSeqInLoop = startFrom - 1;
      const currentList = recipients[selectedTemplateId] || [];
      currentList.forEach(r => {
        if (r.runningNumber?.endsWith(yearSuffix)) {
          const seq = parseInt(r.runningNumber.split('/')[0]);
          if (!isNaN(seq) && seq > maxSeqInLoop) maxSeqInLoop = seq;
        }
      });
      
      if (lastSeq === -1) lastSeq = maxSeqInLoop;
      lastSeq++;

      onAddRecipient({
        id: (Date.now() + index).toString() + Math.random(),
        templateId: selectedTemplateId,
        name: name,
        type: recipientForm.type,
        school: recipientForm.school,
        runningNumber: `${lastSeq}${yearSuffix}`,
        customDescription: recipientForm.customDesc || undefined
      });
    });

    setBatchNames('');
    setInputMode('SINGLE');
  };

  // ฟังก์ชันอัปโหลดไปยัง Google Drive
  const handleDriveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!accessToken) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
      return;
    }

    setIsUploading(true);
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [DRIVE_FOLDER_ID],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form,
      });

      const result = await response.json();
      if (result.id) {
        // แชร์ไฟล์ให้ทุกคนที่มีลิงก์สามารถดูได้ (เลือกทำได้)
        await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
          method: 'POST',
          headers: new Headers({ 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' }),
          body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        });

        const fileLink = result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`;
        setDocForm(prev => ({ ...prev, files: [...prev.files, { name: file.name, url: fileLink }] }));
      }
    } catch (err) {
      console.error(err);
      alert('อัปโหลดล้มเหลว กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
      if (driveFileInputRef.current) driveFileInputRef.current.value = '';
    }
  };

  const removeFileFromDoc = (index: number) => {
    setDocForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title || docForm.files.length === 0) {
        alert('กรุณาระบุชื่อเอกสารและแนบไฟล์อย่างน้อย 1 ไฟล์');
        return;
    }
    onSaveDocument({ id: `new-${Date.now()}`, ...docForm });
    setDocForm({ title: '', type: 'หนังสือ', date: new Date().toISOString().split('T')[0], files: [], description: '' });
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

      if (!currentTemplate) return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
           <i className="fas fa-search text-5xl mb-4"></i>
           <p className="font-bold mb-4 uppercase tracking-widest text-sm">ไม่พบข้อมูลโครงการที่เลือก</p>
           <button onClick={() => setView('LIST')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-lg">กลับหน้าหลัก</button>
        </div>
      );

      return (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 pb-20 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedTemplateId(null); setView('LIST'); }} className="bg-slate-950 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-md border-b-2 border-slate-900">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-slate-950 leading-tight">{currentTemplate.name}</h2>
                      <p className="text-[12px] text-blue-700 font-black mt-1 uppercase italic tracking-widest">{currentTemplate.projectName}</p>
                    </div>
                  </div>
                  <button onClick={() => window.print()} className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-emerald-800 transition-all shadow-md border-b-4 border-emerald-950 uppercase tracking-widest">
                      <i className="fas fa-print mr-2"></i> พิมพ์เกียรติบัตรทั้งหมด
                  </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        <div className="flex-grow">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                                    <i className="fas fa-user-plus mr-2 text-blue-600"></i> {inputMode === 'SINGLE' ? 'ชื่อ-นามสกุล ผู้รับ' : 'วางรายชื่อ (1 ชื่อต่อบรรทัด)'}
                                </label>
                                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                                    <button onClick={() => setInputMode('SINGLE')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${inputMode === 'SINGLE' ? 'bg-slate-950 text-white' : 'text-slate-400'}`}>คนเดียว</button>
                                    <button onClick={() => setInputMode('BATCH')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${inputMode === 'BATCH' ? 'bg-slate-950 text-white' : 'text-slate-400'}`}>เพิ่มแบบกลุ่ม</button>
                                </div>
                            </div>
                            
                            {inputMode === 'SINGLE' ? (
                                <form onSubmit={handleAddRecipientLocal} className="flex flex-col md:flex-row gap-4">
                                    <input 
                                        ref={nameInputRef}
                                        type="text" 
                                        value={recipientForm.name} 
                                        onChange={e => setRecipientForm({...recipientForm, name: e.target.value})} 
                                        className="flex-grow border-2 border-slate-200 bg-white p-4 rounded-xl text-lg font-black text-slate-950 focus:border-blue-600 outline-none transition-all shadow-sm" 
                                        placeholder="พิมพ์ชื่อ-นามสกุล..." 
                                        required 
                                        autoFocus 
                                    />
                                    <button type="submit" className="bg-blue-700 text-white px-10 py-4 rounded-xl hover:bg-blue-800 shadow-lg font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all border-b-4 border-blue-950 whitespace-nowrap">
                                        บันทึกรายชื่อ
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <textarea 
                                        value={batchNames} 
                                        onChange={e => setBatchNames(e.target.value)} 
                                        className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl text-base font-bold text-slate-950 focus:border-blue-600 outline-none transition-all min-h-[120px]" 
                                        placeholder="ตัวอย่าง:&#10;นายสมชาย ใจดี&#10;นางสาวรักเรียน มีสุข..."
                                    />
                                    <button onClick={handleBatchAdd} disabled={!batchNames.trim()} className="w-full bg-indigo-700 text-white py-4 rounded-xl hover:bg-indigo-800 shadow-lg font-black text-sm uppercase tracking-widest active:scale-95 transition-all border-b-4 border-indigo-950 disabled:opacity-50">
                                        <i className="fas fa-users-cog mr-2"></i> ยืนยันเพิ่มรายชื่อทั้งหมด
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 min-w-[300px]">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">ประเภทผู้รับ</label>
                                    <select value={recipientForm.type} onChange={e => setRecipientForm({...recipientForm, type: e.target.value})} className="w-full border-2 border-slate-200 bg-white px-4 py-3 rounded-xl text-xs font-black text-slate-950 outline-none">
                                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">โรงเรียน</label>
                                    <select value={recipientForm.school} onChange={e => setRecipientForm({...recipientForm, school: e.target.value})} className="w-full border-2 border-slate-200 bg-white px-4 py-3 rounded-xl text-xs font-black text-slate-950 outline-none">
                                        {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">รายการรางวัล / คำอธิบายเพิ่มเติม</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {presets.slice(0, 5).map(p => (
                                        <button key={p.id} type="button" onClick={() => setRecipientForm({...recipientForm, customDesc: p.text})} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${recipientForm.customDesc === p.text ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400'}`}>{p.text}</button>
                                    ))}
                                </div>
                                <input type="text" value={recipientForm.customDesc} onChange={e => setRecipientForm({...recipientForm, customDesc: e.target.value})} className="w-full border-2 border-slate-200 bg-white p-3 rounded-xl text-xs font-bold text-slate-950 focus:border-blue-600 outline-none" placeholder="ระบุรางวัลเอง..." />
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col h-[600px]">
                      <div className="px-8 py-4 bg-slate-950 text-white flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-[0.2em]"><i className="fas fa-list-ul mr-2 text-blue-400"></i> รายชื่อที่บันทึกแล้ว ({currentRecipients.length})</span>
                      </div>
                      <div className="overflow-y-auto flex-grow custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase w-24">เลขที่</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">รายชื่อ - ตำแหน่ง - รางวัล</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">สังกัดโรงเรียน</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase w-32">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {currentRecipients.length > 0 ? currentRecipients.map((recipient) => (
                                    <tr key={recipient.id} className="hover:bg-blue-50/40 transition-all group">
                                        <td className="px-8 py-3 text-xs font-bold text-slate-400">{recipient.runningNumber}</td>
                                        <td className="px-8 py-3">
                                          <div className="flex items-center gap-3">
                                            <span className="text-base font-black text-slate-950">{recipient.name}</span>
                                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase">{recipient.type || 'นักเรียน'}</span>
                                          </div>
                                          {recipient.customDescription && (
                                            <p className="text-[11px] text-blue-700 font-bold mt-0.5 italic">{recipient.customDescription}</p>
                                          )}
                                        </td>
                                        <td className="px-8 py-3 text-sm font-bold text-slate-500">{recipient.school || '-'}</td>
                                        <td className="px-8 py-3 text-right">
                                            <button 
                                              onClick={() => { if(confirm('ต้องการลบรายชื่อนี้ใช่หรือไม่?')) onDeleteRecipient(recipient.id, selectedTemplateId!); }} 
                                              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-rose-700 hover:border-rose-400 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                            >
                                                <i className="fas fa-trash-alt text-[12px]"></i>
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                  <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                      <div className="flex flex-col items-center justify-center text-slate-200">
                                          <i className="fas fa-user-plus text-5xl mb-4"></i>
                                          <p className="text-sm font-black uppercase tracking-widest italic text-slate-300">เริ่มพิมพ์รายชื่อด้านบนเพื่อสร้างเกียรติบัตร</p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'MANAGE_DOCUMENTS') {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 pb-20 no-print">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
           <div className="flex items-center gap-4">
              <button onClick={() => setView('LIST')} className="bg-slate-950 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-md border-b-2 border-slate-900">
                  <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-950">คลังเอกสารราชการ</h2>
                <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest">Multi-File Document Repository</p>
              </div>
           </div>
           <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-200 flex items-center gap-4">
              <i className="fab fa-google-drive text-blue-600 text-3xl"></i>
              <div>
                <div className="text-[11px] font-black text-blue-900 uppercase leading-none mb-1">สถานะ Google Drive</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase">
                  {accessToken ? (
                    <span className="flex items-center text-emerald-600"><i className="fas fa-check-circle mr-1"></i> เชื่อมต่อแล้ว</span>
                  ) : (
                    <button onClick={() => tokenClient.requestAccessToken({ prompt: 'consent' })} className="underline hover:text-blue-800 transition-all">คลิกเพื่อเชื่อมต่อ</button>
                  )}
                </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                <form onSubmit={handleAddDoc} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">ชื่อหัวข้อเอกสาร (เช่น คำสั่งแต่งตั้งคณะกรรมการ...)</label>
                          <input type="text" value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} className="w-full border-2 border-slate-200 p-4 rounded-xl text-base font-black outline-none focus:border-blue-600" placeholder="พิมพ์ชื่อเอกสาร..." required />
                      </div>
                      <div className="md:col-span-3">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">ประเภท</label>
                          <select value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value as DocumentType})} className="w-full border-2 border-slate-200 p-4 rounded-xl text-base font-black outline-none">
                              {DOCUMENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                      </div>
                      <div className="md:col-span-4">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">วันที่ของเอกสาร</label>
                          <input type="date" value={docForm.date} onChange={e => setDocForm({...docForm, date: e.target.value})} className="w-full border-2 border-slate-200 p-4 rounded-xl text-base font-black outline-none" required />
                      </div>
                   </div>

                   {/* ส่วนจัดการไฟล์แนบโดยตรงจาก Google Drive */}
                   <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <label className="text-[12px] font-black text-blue-700 uppercase tracking-widest flex items-center">
                                <i className="fas fa-cloud-upload-alt mr-2"></i> จัดการไฟล์แนบจาก Google Drive
                            </label>
                            <span className="text-[10px] font-bold text-slate-400">Folder ID: {DRIVE_FOLDER_ID}</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-10 border-4 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 group hover:bg-blue-50/30 hover:border-blue-200 transition-all">
                            <input 
                              type="file" 
                              ref={driveFileInputRef} 
                              className="hidden" 
                              onChange={handleDriveUpload} 
                            />
                            {isUploading ? (
                              <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-sm font-black text-blue-700 uppercase tracking-widest">กำลังอัปโหลดไปยัง Google Drive...</p>
                              </div>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => driveFileInputRef.current?.click()} 
                                disabled={!accessToken}
                                className={`flex flex-col items-center gap-4 transition-all ${!accessToken ? 'opacity-30' : 'group-hover:scale-105'}`}
                              >
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-blue-600 text-3xl">
                                    <i className="fas fa-file-export"></i>
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-black text-slate-950 uppercase tracking-tight">เลือกไฟล์เพื่ออัปโหลด</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{!accessToken ? 'กรุณาคลิกเชื่อมต่อ Google Drive ด้านบนก่อน' : 'ไฟล์จะถูกเก็บไว้ในโฟลเดอร์ที่กำหนดโดยอัตโนมัติ'}</p>
                                </div>
                              </button>
                            )}
                        </div>

                        {docForm.files.length > 0 && (
                            <div className="mt-8 space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">รายการไฟล์ที่เลือก ({docForm.files.length})</p>
                                {docForm.files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50 shadow-sm animate-in fade-in slide-in-from-left-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                                <i className="fas fa-file-pdf"></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <span className="text-sm font-black text-slate-900 block truncate">{f.name}</span>
                                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">ตรวจสอบลิงก์</a>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeFileFromDoc(i)} className="w-10 h-10 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center">
                                            <i className="fas fa-trash-alt text-sm"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                   </div>

                   <button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-blue-700 border-b-4 border-slate-900 transition-all active:scale-95 disabled:opacity-30" disabled={docForm.files.length === 0}>
                        <i className="fas fa-save mr-2"></i> บันทึกข้อมูลเอกสารชุดนี้
                   </button>
                </form>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase w-32">วันที่</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase w-32">ประเภท</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase">รายการเอกสาร</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase w-48">ไฟล์แนบ (Drive)</th>
                            <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase w-24">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {documents.map(d => (
                            <tr key={d.id} className="hover:bg-blue-50/30 group transition-all">
                                <td className="px-8 py-4 text-sm font-bold text-slate-500">{new Date(d.date).toLocaleDateString('th-TH')}</td>
                                <td className="px-8 py-4">
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-black uppercase">{d.type}</span>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="text-base font-black text-slate-950 leading-tight">{d.title}</div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        {(d.files || []).map((f, idx) => (
                                            <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-700 hover:text-blue-900 flex items-center gap-2 font-black group/link">
                                                <i className="fab fa-google-drive text-[12px] opacity-40 group-hover/link:opacity-100 transition-opacity"></i> 
                                                <span className="truncate max-w-[150px]">{f.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <button onClick={() => { if(confirm('ต้องการลบข้อมูลเอกสารนี้ใช่หรือไม่?')) onDeleteDocument(d.id); }} className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all flex items-center justify-center">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    );
  }

  // View อื่นๆ (โรงเรียน, บัญชี, รางวัล)
  if (view === 'MANAGE_SCHOOLS') {
      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-500 pb-16">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">รายชื่อโรงเรียนในกลุ่ม</h3>
                 <button onClick={() => setView('LIST')} className="text-slate-400 font-bold text-sm uppercase hover:text-slate-900 transition-colors">ปิด</button>
              </div>
              <div className="flex gap-3 mb-8">
                 <input type="text" className="flex-grow border-2 border-slate-200 p-4 rounded-xl text-base font-bold outline-none focus:border-blue-700" value={newS} onChange={e => setNewS(e.target.value)} placeholder="พิมพ์ชื่อโรงเรียนใหม่..." />
                 <button onClick={() => { if(newS) { onSaveSchool(newS); setNewS(''); } }} className="bg-blue-700 text-white px-8 rounded-xl font-black text-[16px] uppercase shadow-lg border-b-2 border-blue-900 active:scale-95 transition-all">เพิ่ม</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {schools.map(s => (
                   <div key={s.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-base font-bold text-slate-900">{s.name}</span>
                      <button onClick={() => onDeleteSchool(s.id)} className="text-rose-300 hover:text-rose-700 transition-colors"><i className="fas fa-trash-alt text-sm"></i></button>
                   </div>
                 ))}
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
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-user-cog text-2xl"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">ตั้งค่าบัญชีแอดมิน</h2>
             </div>
             <form onSubmit={handleUpdateAccount} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-900 uppercase mb-3 tracking-widest">Username ใหม่</label>
                  <input type="text" required className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-base font-bold text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value})} placeholder="ป้อนชื่อผู้ใช้งานใหม่" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 uppercase mb-3 tracking-widest">Password ใหม่</label>
                  <input type="password" required className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-base font-bold text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={accountForm.password} onChange={e => setAccountForm({...accountForm, password: e.target.value})} placeholder="ป้อนรหัสผ่านใหม่" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 uppercase mb-3 tracking-widest">ยืนยัน Password</label>
                  <input type="password" required className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-base font-bold text-slate-950 focus:bg-white focus:border-blue-700 outline-none transition-all" value={accountForm.confirmPassword} onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})} placeholder="ยืนยันรหัสผ่านอีกครั้ง" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setView('LIST')} className="flex-1 px-6 py-4 rounded-xl font-black text-sm text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">ยกเลิก</button>
                  <button type="submit" className="flex-[2] bg-slate-950 text-white py-4 rounded-xl font-black text-sm hover:bg-blue-700 shadow-xl border-b-4 border-slate-900 uppercase tracking-widest transition-all">บันทึกข้อมูล</button>
                </div>
             </form>
          </div>
        </div>
      );
  }

  if (view === 'MANAGE_PRESETS') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-500 pb-16">
         <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">ตั้งค่ารายการรางวัล</h3>
               <button onClick={() => setView('LIST')} className="text-slate-400 font-bold text-sm uppercase hover:text-slate-900 transition-colors">ปิด</button>
            </div>
            <div className="flex gap-3 mb-8">
               <input type="text" className="flex-grow border-2 border-slate-200 p-4 rounded-xl text-base font-bold outline-none focus:border-blue-700" value={newP} onChange={e => setNewP(e.target.value)} placeholder="พิมพ์ชื่อรางวัลใหม่..." />
               <button onClick={() => { if(newP) { onSavePreset(newP); setNewP(''); } }} className="bg-blue-700 text-white px-8 rounded-xl font-black text-sm uppercase shadow-lg border-b-2 border-blue-900">เพิ่มรางวัล</button>
            </div>
            <div className="space-y-3">
               {presets.map(p => (
                 <div key={p.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-base font-bold text-slate-900">{p.text}</span>
                    <button onClick={() => onDeletePreset(p.id)} className="text-rose-300 hover:text-rose-700 transition-colors"><i className="fas fa-trash-alt text-sm"></i></button>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-16 no-print">
      <div className="flex flex-col md:flex-row justify-between items-end gap-5 bg-white p-10 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none">แผงควบคุมแอดมิน</h2>
            <p className="text-blue-800 mt-2 font-black uppercase tracking-widest text-[11px] italic">Muang Nang Rong School Group E-System</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <button onClick={() => setView('ACCOUNT_SETTINGS')} className="bg-white text-slate-900 px-6 py-3 rounded-xl shadow-md hover:bg-slate-50 transition-all font-black text-[12px] flex items-center border-b-2 border-slate-200 uppercase tracking-widest"><i className="fas fa-user-shield mr-2 text-slate-400"></i> บัญชี</button>
              <button onClick={() => setView('MANAGE_SCHOOLS')} className="bg-white text-emerald-700 border-2 border-emerald-100 px-6 py-3 rounded-xl shadow-sm hover:bg-emerald-50 transition-all font-black text-[12px] flex items-center uppercase tracking-widest"><i className="fas fa-school mr-2"></i> โรงเรียน</button>
              <button onClick={() => setView('MANAGE_DOCUMENTS')} className="bg-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-amber-700 transition-all font-black text-[12px] flex items-center border-b-4 border-amber-950 uppercase tracking-widest"><i className="fas fa-file-invoice mr-2"></i> คลังเอกสาร</button>
              <button onClick={() => setView('MANAGE_PRESETS')} className="bg-slate-950 text-white px-6 py-3 rounded-xl shadow-md hover:bg-slate-800 transition-all font-black text-[12px] flex items-center border-b-2 border-slate-900 uppercase tracking-widest"><i className="fas fa-tasks mr-2 text-blue-400"></i> รายการรางวัล</button>
              <button onClick={startCreate} className="bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-800 transition-all font-black text-[12px] flex items-center border-b-4 border-blue-950 uppercase tracking-widest"><i className="fas fa-plus-circle mr-2"></i> สร้างดีไซน์ใหม่</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map(template => (
              <div key={template.id} className="bg-white rounded-[2rem] shadow-md border border-slate-200 overflow-hidden flex flex-col group hover:-translate-y-2 transition-all duration-300 hover:border-blue-600">
                  <div className="h-48 bg-slate-200 overflow-hidden relative">
                      <img src={template.backgroundImage || 'https://via.placeholder.com/400x300?text=MNR'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={template.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
                      <div className="absolute top-5 right-5">
                        <span className="bg-white/95 px-4 py-1.5 rounded-lg text-[12px] font-black shadow-md text-slate-950 border border-slate-100 flex items-center">
                          <i className="fas fa-users mr-2 text-blue-700"></i> {recipients[template.id]?.length || 0} รายชื่อ
                        </span>
                      </div>
                  </div>
                  <div className="p-8 flex-grow">
                      <h3 className="font-black text-xl text-slate-950 line-clamp-1 tracking-tight">{template.name}</h3>
                      <p className="text-[12px] text-slate-600 mt-2 font-bold uppercase tracking-widest italic line-clamp-1">"{template.projectName}"</p>
                  </div>
                  <div className="bg-slate-50 p-5 flex gap-3 border-t border-slate-100">
                      <button onClick={() => startManage(template.id)} className="flex-[2] bg-blue-700 text-white text-[12px] font-black py-3 rounded-xl hover:bg-blue-800 transition-all uppercase tracking-widest shadow-sm border-b-2 border-blue-900">จัดการรายชื่อ</button>
                      <button onClick={() => startEdit(template)} className="flex-1 bg-white border border-slate-300 text-[12px] font-black text-slate-950 py-3 rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest">ดีไซน์</button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
