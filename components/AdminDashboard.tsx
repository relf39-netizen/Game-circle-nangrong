
import React, { useState, useEffect, useRef } from 'react';
import { AwardTemplate, Recipient, TYPE_OPTIONS, AwardPreset, SchoolItem, DocumentItem, toThaiDigits } from '../types.ts';
import { CertificateDesigner } from './CertificateDesigner.tsx';
import { DocumentManager } from './DocumentManager.tsx';
import { CertificateRenderer } from './CertificateRenderer.tsx';
import { db, doc, setDoc, getDoc } from '../firebaseConfig.ts';

const GAS_CODE = `/**
 * MNR E-SYSTEM: Google Apps Script Backend (Proxy Engine)
 * Deployment: Execute as "Me", Access "Anyone"
 */
function doPost(e) {
  var result = { status: 'error', message: 'Unknown error' };
  try {
    var params = JSON.parse(e.postData.contents);
    
    if (params.action === 'uploadFile') {
      var folder = DriveApp.getFolderById(params.folderId);
      var decodedData = Utilities.base64Decode(params.base64Data);
      var blob = Utilities.newBlob(decodedData, params.mimeType, params.fileName);
      var file = folder.createFile(blob);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      result = {
        status: 'success',
        id: file.getId(),
        name: file.getName(),
        url: "https://drive.google.com/file/d/" + file.getId() + "/view?usp=sharing"
      };
    }
  } catch (err) {
    result.message = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface AdminDashboardProps {
  templates: AwardTemplate[];
  recipients: Record<string, Recipient[]>;
  presets: AwardPreset[];
  schools: SchoolItem[];
  documents: DocumentItem[];
  onSaveTemplate: (template: AwardTemplate) => void;
  onAddRecipient: (recipient: Recipient) => void;
  onUpdateRecipient?: (recipient: Recipient) => void;
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
    templates, recipients, presets, schools, documents,
    onSaveTemplate, onAddRecipient, onUpdateRecipient, onDeleteRecipient,
    onSavePreset, onDeletePreset, onSaveSchool, onDeleteSchool,
    onSaveDocument, onDeleteDocument, isCloud
}) => {
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem('mnr_admin_view') as ViewMode) || 'LIST');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => localStorage.getItem('mnr_admin_selected_id'));
  
  const [editingTemplate, setEditingTemplate] = useState<AwardTemplate | undefined>(undefined);
  const [inputMode, setInputMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [batchNames, setBatchNames] = useState('');
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
  const [usePrefix, setUsePrefix] = useState(true);
  
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newPresetText, setNewPresetText] = useState('');

  const [recipientForm, setRecipientForm] = useState({
      name: '',
      type: 'นักเรียน',
      school: '',
      customDesc: '',
  });

  const [driveFolderId, setDriveFolderId] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [accountForm, setAccountForm] = useState({ username: '', password: '', confirmPassword: '' });
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mnr_admin_view', view);
    if (selectedTemplateId) {
      localStorage.setItem('mnr_admin_selected_id', selectedTemplateId);
    }
    const loadConfig = async () => {
      if (db) {
        try {
          const configDoc = await getDoc(doc(db, 'config', 'drive'));
          if (configDoc.exists()) {
            const data = configDoc.data();
            setDriveFolderId(data.folderId || '');
            setAppsScriptUrl(data.appsScriptUrl || '');
          }
        } catch (e) {}
      }
    };
    loadConfig();
  }, [view, selectedTemplateId]);

  const startCreate = () => { setEditingTemplate(undefined); setView('CREATE_DESIGN'); };
  const startManage = (templateId: string) => { setSelectedTemplateId(templateId); setView('MANAGE_RECIPIENTS'); };
  const startEdit = (template: AwardTemplate) => { setEditingTemplate(template); setView('CREATE_DESIGN'); };

  const loadDependencies = async () => {
    if (!(window as any).html2canvas) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!(window as any).jspdf) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
  };

  const handleSyncToDrive = async (recipient: Recipient, template: AwardTemplate, silent = false) => {
    if (!appsScriptUrl || !driveFolderId) {
      if (!silent) alert('กรุณาตั้งค่า Folder ID และ Apps Script URL ในหน้าตั้งค่าก่อน');
      return;
    }
    setSyncingIds(prev => new Set(prev).add(recipient.id));
    try {
      await loadDependencies();
      const renderContainer = document.createElement('div');
      renderContainer.style.position = 'fixed';
      renderContainer.style.top = '-9999px';
      renderContainer.style.left = '-9999px';
      document.body.appendChild(renderContainer);
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(renderContainer);
      await new Promise<void>((resolve) => {
        root.render(<div style={{ width: '1000px', height: '707px' }}><CertificateRenderer template={template} recipient={recipient} /></div>);
        setTimeout(resolve, 1500);
      });

      const canvas = await (window as any).html2canvas(renderContainer.firstChild as HTMLElement, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const fileName = `Certificate_${recipient.name}_${recipient.runningNumber.replace(/\//g, '-')}.pdf`;

      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'uploadFile', folderId: driveFolderId.trim(), fileName: fileName, mimeType: 'application/pdf', base64Data: pdfBase64 }),
        redirect: 'follow'
      });
      const resultText = await response.text();
      const result = JSON.parse(resultText);
      if (result.status === 'success' && result.url) {
        if (onUpdateRecipient) await onUpdateRecipient({ ...recipient, pdfUrl: result.url });
      } else { throw new Error(result.message || 'Upload failed'); }
      root.unmount();
      document.body.removeChild(renderContainer);
    } catch (err) {
      if (!silent) alert(`ไม่สามารถ Sync ${recipient.name} ได้: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`);
    } finally {
      setSyncingIds(prev => { const next = new Set(prev); next.delete(recipient.id); return next; });
    }
  };

  const handleBatchSync = async () => {
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    if (!currentTemplate || selectedRecipientIds.size === 0) return;
    if (!confirm(`ยืนยันการ Sync รายชื่อที่เลือกจำนวน ${selectedRecipientIds.size} รายการขึ้น Google Drive เป็นไฟล์ PDF?`)) return;
    const listToSync = (recipients[selectedTemplateId!] || []).filter(r => selectedRecipientIds.has(r.id));
    for (const recipient of listToSync) { await handleSyncToDrive(recipient, currentTemplate, true); }
    setSelectedRecipientIds(new Set());
    alert('ดำเนินการ Sync เสร็จสิ้นแล้ว');
  };

  const saveSystemConfig = async () => {
    if (db) {
      try {
        await setDoc(doc(db, 'config', 'drive'), { folderId: driveFolderId.trim(), appsScriptUrl: appsScriptUrl.trim() });
        alert('บันทึกการตั้งค่าสำเร็จ');
      } catch (e) { alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล'); }
    }
  };

  if (view === 'CREATE_DESIGN') {
    return <CertificateDesigner initialTemplate={editingTemplate} onSave={(t) => { onSaveTemplate(t); setView('LIST'); }} onCancel={() => setView('LIST')} />;
  }

  if (view === 'MANAGE_DOCUMENTS') {
    return <DocumentManager documents={documents} onSaveDocument={onSaveDocument} onDeleteDocument={onDeleteDocument} driveFolderId={driveFolderId} appsScriptUrl={appsScriptUrl} onNavigateBack={() => setView('LIST')} />;
  }

  if (view === 'MANAGE_SCHOOLS') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
           <div className="flex items-center gap-4 mb-8">
             <button onClick={() => setView('LIST')} className="bg-slate-950 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all"><i className="fas fa-arrow-left"></i></button>
             <h2 className="text-xl font-black text-slate-900 uppercase">จัดการรายชื่อโรงเรียน</h2>
           </div>
           <div className="flex gap-3 mb-8">
             <input type="text" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} className="flex-grow border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-blue-600" placeholder="ชื่อโรงเรียน..." />
             <button onClick={() => { if(newSchoolName.trim()){ onSaveSchool(newSchoolName.trim()); setNewSchoolName(''); } }} className="bg-blue-700 text-white px-8 rounded-xl font-black text-sm uppercase">เพิ่ม</button>
           </div>
           <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
             {schools.map(s => (
               <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-white hover:shadow-md transition-all">
                 <span className="font-bold text-slate-700">{s.name}</span>
                 <button onClick={() => { if(confirm('ลบโรงเรียนนี้?')) onDeleteSchool(s.id); }} className="text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt"></i></button>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  if (view === 'MANAGE_PRESETS') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
           <div className="flex items-center gap-4 mb-8">
             <button onClick={() => setView('LIST')} className="bg-slate-950 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all"><i className="fas fa-arrow-left"></i></button>
             <h2 className="text-xl font-black text-slate-900 uppercase">จัดการรางวัล/คำอธิบาย</h2>
           </div>
           <div className="flex gap-3 mb-8">
             <input type="text" value={newPresetText} onChange={e => setNewPresetText(e.target.value)} className="flex-grow border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-blue-600" placeholder="ข้อความรางวัล..." />
             <button onClick={() => { if(newPresetText.trim()){ onSavePreset(newPresetText.trim()); setNewPresetText(''); } }} className="bg-blue-700 text-white px-8 rounded-xl font-black text-sm uppercase">เพิ่ม</button>
           </div>
           <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
             {presets.map(p => (
               <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-white hover:shadow-md transition-all">
                 <span className="font-bold text-slate-700">{p.text}</span>
                 <button onClick={() => { if(confirm('ลบรางวัลนี้?')) onDeletePreset(p.id); }} className="text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt"></i></button>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  if (view === 'ACCOUNT_SETTINGS') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-16">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-slate-100">
           <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">System Settings</h2>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-network-wired text-blue-600"></i> Cloud Connectivity
                </h3>
                <div className="space-y-4">
                  <input type="text" className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl text-sm font-bold outline-none" value={driveFolderId} onChange={e => setDriveFolderId(e.target.value)} placeholder="Google Drive Folder ID" />
                  <input type="text" className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl text-sm font-bold outline-none" value={appsScriptUrl} onChange={e => setAppsScriptUrl(e.target.value)} placeholder="Apps Script URL" />
                </div>
                <button onClick={saveSystemConfig} className="w-full bg-blue-700 text-white py-4 rounded-xl font-black text-xs uppercase shadow-md">บันทึก Cloud Config</button>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-user-lock text-rose-600"></i> Security
                </h3>
                <form onSubmit={async (e) => { e.preventDefault(); if(accountForm.password === accountForm.confirmPassword && db) { await setDoc(doc(db, 'config', 'admin'), { username: accountForm.username, password: accountForm.password }); alert('อัปเดตบัญชีสำเร็จ'); } }} className="space-y-4">
                  <input type="text" required className="w-full border-2 border-slate-100 p-4 rounded-xl text-sm font-bold outline-none" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value})} placeholder="New Username" />
                  <input type="password" required className="w-full border-2 border-slate-100 p-4 rounded-xl text-sm font-bold outline-none" value={accountForm.password} onChange={e => setAccountForm({...accountForm, password: e.target.value})} placeholder="New Password" />
                  <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-xl font-black text-xs uppercase shadow-md">อัปเดตความปลอดภัย</button>
                </form>
              </div>
           </div>
           <div className="mt-8 flex justify-center">
             <button onClick={() => setView('LIST')} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2"><i className="fas fa-arrow-left"></i> กลับหน้าควบคุม</button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'MANAGE_RECIPIENTS') {
      const currentTemplate = templates.find(t => t.id === selectedTemplateId);
      const currentRecipients = (recipients[selectedTemplateId!] || []).sort((a,b) => {
          const seqA = parseInt(a.runningNumber.split('/').pop()?.split(' ').pop() || a.runningNumber) || 0;
          const seqB = parseInt(b.runningNumber.split('/').pop()?.split(' ').pop() || b.runningNumber) || 0;
          return seqB - seqA;
      });

      if (!currentTemplate) return <div className="py-20 text-center"><button onClick={() => setView('LIST')} className="bg-slate-950 text-white px-8 py-3 rounded-xl">กลับหน้าหลัก</button></div>;
      const allSelected = currentRecipients.length > 0 && selectedRecipientIds.size === currentRecipients.length;

      const getNewRunningNumber = (indexOffset = 0) => {
          const thaiYear = new Date().getFullYear() + 543;
          const yearSuffix = `/${thaiYear}`;
          const startFrom = currentTemplate.startNumber || 1;
          let maxSeq = startFrom - 1;
          (recipients[selectedTemplateId!] || []).forEach(r => {
              if (r.runningNumber?.includes(yearSuffix)) {
                  const parts = r.runningNumber.split(yearSuffix)[0].split(' ');
                  const seqStr = parts[parts.length - 1];
                  const seq = parseInt(seqStr);
                  if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
              }
          });
          const nextSeq = maxSeq + 1 + indexOffset;
          const prefixPart = usePrefix && currentTemplate.prefix ? `${currentTemplate.prefix} ` : '';
          return `${prefixPart}${nextSeq}${yearSuffix}`;
      };

      const nextNumberPreview = toThaiDigits(getNewRunningNumber());

      return (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 pb-20 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedTemplateId(null); setView('LIST'); setSelectedRecipientIds(new Set()); }} className="bg-slate-950 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-md"><i className="fas fa-arrow-left text-sm"></i></button>
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{currentTemplate.name}</h2>
                      <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest">{currentTemplate.projectName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedRecipientIds.size > 0 && (
                        <button onClick={handleBatchSync} className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-md uppercase tracking-widest border-b-2 border-blue-950 flex items-center gap-2">
                            <i className="fas fa-sync-alt"></i> Sync {selectedRecipientIds.size} รายการ (PDF)
                        </button>
                    )}
                    <button onClick={() => window.print()} className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-md uppercase tracking-widest"><i className="fas fa-print mr-2"></i> พิมพ์ทั้งหมด</button>
                  </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Area 1: Names Input (Expanded) */}
                        <div className="lg:flex-[1.8] flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">เพิ่มรายชื่อ</label>
                                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                        เลขที่ถัดไป: {nextNumberPreview}
                                    </span>
                                </div>
                                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                                    <button onClick={() => setInputMode('SINGLE')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${inputMode === 'SINGLE' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>คนเดียว</button>
                                    <button onClick={() => setInputMode('BATCH')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${inputMode === 'BATCH' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>กลุ่ม</button>
                                </div>
                            </div>
                            
                            {inputMode === 'SINGLE' ? (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!selectedTemplateId || !recipientForm.name) return;
                                    onAddRecipient({
                                        id: Date.now().toString() + Math.random(),
                                        templateId: selectedTemplateId,
                                        name: recipientForm.name.trim(),
                                        type: recipientForm.type,
                                        school: recipientForm.school,
                                        runningNumber: getNewRunningNumber(),
                                        customDescription: recipientForm.customDesc || undefined
                                    });
                                    setRecipientForm(prev => ({ ...prev, name: '' })); 
                                    nameInputRef.current?.focus();
                                }} className="flex flex-col gap-3 h-full">
                                    <input ref={nameInputRef} type="text" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value})} className="w-full border-2 border-slate-200 bg-white p-4 rounded-2xl text-xl font-bold text-slate-950 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300" placeholder="ระบุ ชื่อ-นามสกุล..." required autoFocus />
                                    <button type="submit" className="w-full bg-blue-700 text-white py-4 rounded-2xl shadow-lg font-black text-sm uppercase tracking-widest border-b-4 border-blue-950 active:translate-y-1 active:border-b-0 transition-all">บันทึกรายชื่อ</button>
                                </form>
                            ) : (
                                <div className="flex flex-col gap-3 h-full">
                                    <textarea value={batchNames} onChange={e => setBatchNames(e.target.value)} className="w-full border-2 border-slate-200 bg-white p-4 rounded-2xl text-lg font-bold outline-none min-h-[160px] focus:border-indigo-600 transition-all placeholder:text-slate-300" placeholder="วางรายชื่อที่นี่... (1 ชื่อต่อบรรทัด)" />
                                    <button onClick={() => {
                                        if (!selectedTemplateId || !batchNames.trim()) return;
                                        const names = batchNames.split('\n').map(n => n.trim()).filter(n => n !== '');
                                        names.forEach((name, index) => {
                                          onAddRecipient({
                                            id: (Date.now() + index).toString() + Math.random(),
                                            templateId: selectedTemplateId,
                                            name: name,
                                            type: recipientForm.type,
                                            school: recipientForm.school,
                                            runningNumber: getNewRunningNumber(index),
                                            customDescription: recipientForm.customDesc || undefined
                                          });
                                        });
                                        setBatchNames('');
                                        setInputMode('SINGLE');
                                    }} className="w-full bg-indigo-700 text-white py-4 rounded-2xl shadow-lg font-black text-sm uppercase tracking-widest border-b-4 border-indigo-950 active:translate-y-1 active:border-b-0 transition-all">เพิ่มกลุ่มรายชื่อ</button>
                                </div>
                            )}
                        </div>

                        {/* Area 2: Settings (Fixed Side) */}
                        <div className="lg:flex-[1.2] flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ประเภทผู้รับ</label>
                                    <select value={recipientForm.type} onChange={e => setRecipientForm({...recipientForm, type: e.target.value})} className="w-full border-2 border-slate-100 bg-white p-3 rounded-xl text-xs font-black shadow-sm outline-none focus:border-blue-500">
                                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">โรงเรียน/หน่วยงาน</label>
                                    <select value={recipientForm.school} onChange={e => setRecipientForm({...recipientForm, school: e.target.value})} className="w-full border-2 border-slate-100 bg-white p-3 rounded-xl text-xs font-black shadow-sm outline-none focus:border-blue-500">
                                        <option value="">-- เลือกโรงเรียน --</option>
                                        {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 space-y-2 shadow-sm">
                                <label className="text-[11px] font-black text-blue-900 uppercase flex items-center gap-3 cursor-pointer">
                                   <input type="checkbox" checked={usePrefix} onChange={e => setUsePrefix(e.target.checked)} className="w-4 h-4 accent-blue-700 rounded-md" />
                                   <span>ใช้คำนำหน้าเลขที่ ({currentTemplate.prefix || 'ว่าง'})</span>
                                </label>
                                <p className="text-[10px] text-slate-400 font-bold italic border-t border-blue-50 pt-2">
                                    ตัวอย่าง: {nextNumberPreview}
                                </p>
                            </div>

                            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">รายละเอียดรางวัล / คำอธิบาย</label>
                                <div className="flex flex-wrap gap-1.5 mb-1 max-h-[80px] overflow-y-auto p-1 custom-scrollbar">
                                    {presets.map(p => (
                                        <button 
                                          key={p.id} 
                                          onClick={() => setRecipientForm({...recipientForm, customDesc: p.text})}
                                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 hover:border-blue-500 hover:text-blue-700 hover:shadow-sm transition-all whitespace-nowrap"
                                        >
                                          {p.text}
                                        </button>
                                    ))}
                                    {presets.length === 0 && <span className="text-[9px] text-gray-300 italic p-1">ยังไม่มีรายการแนะนำ</span>}
                                </div>
                                <input type="text" value={recipientForm.customDesc} onChange={e => setRecipientForm({...recipientForm, customDesc: e.target.value})} className="w-full border-2 border-white bg-white p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 shadow-sm" placeholder="พิมพ์รางวัลที่นี่..." />
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">รางวัลเริ่มต้น:</span>
                                    <span className="text-[9px] text-blue-800 font-black">{currentTemplate.defaultDescription || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col h-[480px]">
                      <div className="overflow-y-auto flex-grow custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-4 w-12"><input type="checkbox" checked={allSelected} onChange={(e) => { if (e.target.checked) setSelectedRecipientIds(new Set(currentRecipients.map(r => r.id))); else setSelectedRecipientIds(new Set()); }} className="accent-blue-700" /></th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">เลขที่</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">รายชื่อ - รางวัล</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">โรงเรียน</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Drive Sync</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentRecipients.map((recipient) => (
                                    <tr key={recipient.id} className={`hover:bg-blue-50/40 group transition-all ${selectedRecipientIds.has(recipient.id) ? 'bg-blue-50/60' : ''}`}>
                                        <td className="px-4 py-3"><input type="checkbox" checked={selectedRecipientIds.has(recipient.id)} onChange={(e) => { const next = new Set(selectedRecipientIds); if (e.target.checked) next.add(recipient.id); else next.delete(recipient.id); setSelectedRecipientIds(next); }} className="accent-blue-700" /></td>
                                        <td className="px-6 py-3 text-[11px] font-bold text-slate-400">{toThaiDigits(recipient.runningNumber)}</td>
                                        <td className="px-6 py-3">
                                          <div className="flex items-center gap-2"><span className="text-base font-black text-slate-950">{recipient.name}</span>{recipient.pdfUrl && <i className="fas fa-file-pdf text-rose-600 text-[12px]"></i>}</div>
                                          <p className="text-[11px] text-blue-700 font-bold italic">
                                              {recipient.customDescription || currentTemplate.defaultDescription || '-'}
                                          </p>
                                        </td>
                                        <td className="px-6 py-3 text-[12px] font-bold text-slate-500">{recipient.school || '-'}</td>
                                        <td className="px-6 py-3 text-right">
                                            {recipient.pdfUrl ? (
                                              <a href={recipient.pdfUrl} target="_blank" className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><i className="fas fa-external-link-alt"></i> เปิด PDF</a>
                                            ) : (
                                              <button onClick={() => handleSyncToDrive(recipient, currentTemplate)} disabled={syncingIds.has(recipient.id)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${syncingIds.has(recipient.id) ? 'bg-slate-100 text-slate-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100'}`}>
                                                {syncingIds.has(recipient.id) ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt mr-1"></i>} Sync Drive
                                              </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => { if(confirm('ลบรายชื่อนี้?')) onDeleteRecipient(recipient.id, selectedTemplateId!); }} className="text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-2"><i className="fas fa-trash-alt"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 relative overflow-hidden">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight uppercase">MNR Console</h2>
            <p className="text-blue-800 mt-2 font-black uppercase tracking-[0.2em] text-[10px] italic border-l-4 border-blue-700 pl-4">ศูนย์ควบคุมกลุ่มโรงเรียนเมืองนางรอง</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setView('ACCOUNT_SETTINGS')} className="bg-slate-950 text-white px-5 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all font-black text-[10px] border-b-2 border-slate-800 uppercase tracking-widest"><i className="fas fa-cog mr-2"></i> ตั้งค่าระบบ</button>
              <button onClick={() => setView('MANAGE_SCHOOLS')} className="bg-white text-emerald-700 border-2 border-emerald-100 px-5 py-3 rounded-xl shadow-sm hover:bg-emerald-50 transition-all font-black text-[10px] uppercase tracking-widest">โรงเรียน</button>
              <button onClick={() => setView('MANAGE_PRESETS')} className="bg-white text-slate-950 border-2 border-slate-200 px-5 py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest">รางวัล</button>
              <button onClick={() => setView('MANAGE_DOCUMENTS')} className="bg-amber-600 text-white px-5 py-3 rounded-xl shadow-md hover:bg-amber-700 transition-all font-black text-[10px] border-b-2 border-amber-950 uppercase tracking-widest"><i className="fab fa-google-drive mr-2"></i> คลังเอกสารราชการ</button>
              <button onClick={startCreate} className="bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-800 transition-all font-black text-[10px] border-b-2 border-blue-950 uppercase tracking-widest"><i className="fas fa-plus-circle mr-2"></i> ออกแบบใหม่</button>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {templates.map(template => (
              <div key={template.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col group hover:-translate-y-3 transition-all duration-500 hover:border-blue-600">
                  <div className="h-48 bg-slate-200 overflow-hidden relative">
                      <img src={template.backgroundImage || 'https://via.placeholder.com/400x300?text=MNR'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
                      <div className="absolute bottom-5 right-6">
                        <span className="bg-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg text-slate-950 flex items-center border border-slate-50"><i className="fas fa-users mr-2 text-blue-700"></i> {recipients[template.id]?.length || 0}</span>
                      </div>
                  </div>
                  <div className="p-6 flex-grow">
                      <h3 className="font-black text-lg text-slate-950 line-clamp-1 tracking-tight group-hover:text-blue-700 transition-colors uppercase">{template.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest italic line-clamp-2 border-l-2 border-blue-100 pl-4">"{template.projectName}"</p>
                  </div>
                  <div className="p-6 pt-0 flex gap-3">
                      <button onClick={() => startManage(template.id)} className="flex-[2] bg-blue-700 text-white text-[10px] font-black py-3.5 rounded-xl hover:bg-blue-800 transition-all uppercase tracking-widest shadow-md border-b-2 border-blue-950">จัดการรายชื่อ</button>
                      <button onClick={() => startEdit(template)} className="flex-1 bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 py-3.5 rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest">ดีไซน์</button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
