
import React, { useState, useRef } from 'react';
import { DocumentItem, DocumentType, DOCUMENT_TYPE_OPTIONS, AttachedFile } from '../types';

interface DocumentManagerProps {
  documents: DocumentItem[];
  onSaveDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  driveFolderId: string;
  appsScriptUrl: string;
  onNavigateBack: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onSaveDocument,
  onDeleteDocument,
  driveFolderId,
  appsScriptUrl,
  onNavigateBack
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [docForm, setDocForm] = useState<Omit<DocumentItem, 'id'>>({
    title: '',
    type: 'หนังสือ',
    date: new Date().toISOString().split('T')[0],
    files: [],
    description: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      const filesArray: File[] = Array.from(selected);
      const pdfFiles = filesArray.filter((file: File) => file.name.toLowerCase().endsWith('.pdf'));
      if (pdfFiles.length < filesArray.length) {
        alert('ระบบรองรับเฉพาะไฟล์ PDF เท่านั้น');
      }
      if (pdfFiles.length > 0) {
        setPendingFiles(prev => [...prev, ...pdfFiles]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFileToDrive = async (file: File): Promise<AttachedFile | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'uploadFile',
              folderId: driveFolderId.trim(),
              fileName: file.name,
              mimeType: 'application/pdf',
              base64Data: base64Data
            }),
            redirect: 'follow'
          });
          const resultText = await response.text();
          const result = JSON.parse(resultText);
          if (result.status === 'success') {
            resolve({ name: file.name, url: result.url });
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFiles.length === 0 && docForm.files.length === 0) {
      alert('กรุณาเลือกไฟล์ PDF อย่างน้อย 1 ไฟล์');
      return;
    }
    if (!appsScriptUrl || !driveFolderId) {
      alert('กรุณาตั้งค่าเชื่อมต่อระบบก่อน');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: pendingFiles.length });
    const newlyUploaded: AttachedFile[] = [];
    for (let i = 0; i < pendingFiles.length; i++) {
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      const result = await uploadFileToDrive(pendingFiles[i]);
      if (result) newlyUploaded.push(result);
    }

    const finalDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      ...docForm,
      files: [...docForm.files, ...newlyUploaded]
    };
    onSaveDocument(finalDoc);
    setDocForm({ title: '', type: 'หนังสือ', date: new Date().toISOString().split('T')[0], files: [], description: '' });
    setPendingFiles([]);
    setIsUploading(false);
    alert('บันทึกสำเร็จ');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 pb-20 no-print">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-lg border border-slate-200 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onNavigateBack} className="bg-slate-950 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-md">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-950 uppercase">คลังเอกสารราชการ</h2>
            <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest">Manage Documents (PDF Only)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">หัวข้อเอกสาร</label>
                <input type="text" value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50" placeholder="ชื่อหนังสือหรือประกาศ..." required />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">ประเภท</label>
                <select value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value as DocumentType})} className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-600">
                  {DOCUMENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">วันที่</label>
                <input type="date" value={docForm.date} onChange={e => setDocForm({...docForm, date: e.target.value})} className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-600" required />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer text-center group" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf" onChange={handleFileSelect} />
              <div className="flex flex-col items-center gap-2">
                <i className="fas fa-file-pdf text-2xl text-slate-300 group-hover:text-blue-600 transition-colors"></i>
                <span className="text-xs font-black uppercase text-slate-400 group-hover:text-slate-900 transition-colors">คลิกเพื่อเลือกไฟล์ PDF</span>
              </div>
            </div>

            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file: File, i: number) => (
                  <div key={i} className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-300 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 truncate max-w-[150px]">{file.name}</span>
                    <button type="button" onClick={() => removePendingFile(i)} className="text-amber-400 hover:text-amber-600"><i className="fas fa-times"></i></button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={isUploading || (pendingFiles.length === 0 && docForm.files.length === 0)} className={`w-full py-3.5 rounded-xl font-black text-xs uppercase shadow-md transition-all ${isUploading ? 'bg-amber-500 text-white' : 'bg-slate-950 text-white hover:bg-blue-700'}`}>
              {isUploading ? `กำลังอัปโหลด (${uploadProgress.current}/${uploadProgress.total})...` : 'บันทึกและอัปโหลดเข้า Drive'}
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">วันที่</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">ประเภท</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">หัวข้อเอกสาร</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">ไฟล์แนบ</th>
                <th className="px-6 py-3 text-right text-[9px] font-black text-slate-400 uppercase w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documents.map((doc: DocumentItem) => (
                <tr key={doc.id} className="hover:bg-blue-50/30 transition-all group">
                  <td className="px-6 py-3 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                    {new Date(doc.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${doc.type === 'หนังสือ' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-black text-slate-900">{doc.title}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.files?.map((f: AttachedFile, idx: number) => (
                        <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 px-2 py-1 rounded-md text-[9px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1">
                          <i className="fas fa-file-pdf"></i> PDF
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => onDeleteDocument(doc.id)} className="text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {documents.length === 0 && (
            <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">ไม่พบข้อมูลเอกสาร</div>
          )}
        </div>
      </div>
    </div>
  );
};
