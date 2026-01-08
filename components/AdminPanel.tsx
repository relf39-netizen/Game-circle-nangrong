
import React, { useState } from 'react';
import { Staff, SystemSettings, SCHOOL_GROUPS } from '../types.ts';
import { db, collection, deleteDoc, doc, setDoc } from '../firebaseConfig.ts';

interface AdminPanelProps {
  staff: Staff[];
  settings: SystemSettings;
  onDataChange: () => void;
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ staff, settings, onDataChange, onBack }) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'SETTINGS' | 'EXPORT'>('STAFF');
  const [isUpdating, setIsUpdating] = useState(false);
  const [setForm, setSetForm] = useState(settings);

  const handleDeleteAll = async () => {
    if (!confirm('ยืนยันการลบรายชื่อบุคลากรทั้งหมด?')) return;
    setIsUpdating(true);
    try {
      for (const s of staff) {
        await deleteDoc(doc(db, 'staff', s.id));
      }
      onDataChange();
    } catch (e) { alert('เกิดข้อผิดพลาด'); } finally { setIsUpdating(false); }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await setDoc(doc(db, 'config', 'system'), setForm);
      onDataChange();
      alert('บันทึกการตั้งค่าสำเร็จ');
    } catch (e) { alert('บันทึกไม่สำเร็จ'); } finally { setIsUpdating(false); }
  };

  // ฟังก์ชันดาวน์โหลดไฟล์
  const downloadTextFile = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExport = (type: 'NAME' | 'SCHOOL' | 'FULL') => {
    let content = "";
    staff.forEach((s, idx) => {
      if (type === 'NAME') {
        content += `${s.name}\n`;
      } else if (type === 'SCHOOL') {
        content += `${s.name} - ${s.school}\n`;
      } else {
        content += `${idx + 1}. ${s.name} | ร.ร.${s.school} | กลุ่ม${s.group}\n`;
      }
    });
    const filename = `รายชื่อบุคลากร_${type}_${new Date().toLocaleDateString('th-TH')}.txt`;
    downloadTextFile(content, filename);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('STAFF')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'STAFF' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>จัดการรายชื่อ ({staff.length})</button>
        <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'SETTINGS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>ตั้งค่าระบบ</button>
        <button onClick={() => setActiveTab('EXPORT')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'EXPORT' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>ดาวน์โหลดข้อมูล</button>
        <button onClick={onBack} className="ml-auto px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-black text-xs uppercase hover:bg-slate-700 transition-all">กลับหน้าหลัก</button>
      </div>

      {activeTab === 'STAFF' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black uppercase tracking-tight">รายชื่อบุคลากรทั้งหมด</h3>
             <button onClick={handleDeleteAll} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20">ล้างข้อมูลทั้งหมด</button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ชื่อ-นามสกุล</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">โรงเรียน</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">กลุ่ม</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/50 transition-all group">
                        <td className="px-8 py-4 font-bold">{s.name}</td>
                        <td className="px-8 py-4 text-slate-400">{s.school}</td>
                        <td className="px-8 py-4">
                           <span className="bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black text-blue-400 border border-slate-700">{s.group}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button onClick={async () => { if(confirm('ลบรายชื่อนี้?')) { await deleteDoc(doc(db, 'staff', s.id)); onDataChange(); } }} className="text-slate-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="max-w-2xl">
          <form onSubmit={handleUpdateSettings} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-8">
             <div className="space-y-4">
               <div className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                     <h4 className="font-black text-lg">ระบบลงทะเบียน</h4>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">เปิด-ปิดการรับลงชื่อในระบบ</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSetForm({...setForm, regEnabled: !setForm.regEnabled})}
                    className={`w-16 h-8 rounded-full transition-all relative ${setForm.regEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}
                  >
                     <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${setForm.regEnabled ? 'left-9' : 'left-1'}`}></div>
                  </button>
               </div>

               <div className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                     <h4 className="font-black text-lg">ล็อคการแก้ไข/ลบ</h4>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ล็อคไม่ให้บุคคลทั่วไปแก้ไขรายชื่อ</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSetForm({...setForm, editLocked: !setForm.editLocked})}
                    className={`w-16 h-8 rounded-full transition-all relative ${setForm.editLocked ? 'bg-blue-600' : 'bg-slate-800'}`}
                  >
                     <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${setForm.editLocked ? 'left-9' : 'left-1'}`}></div>
                  </button>
               </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">รหัสผ่านความปลอดภัย</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase ml-1">รหัสหมุนวงล้อ</label>
                      <input type="text" value={setForm.spinPassword} onChange={e => setSetForm({...setForm, spinPassword: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-xl font-bold outline-none focus:border-blue-600 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase ml-1">รหัสผู้ดูแลระบบ</label>
                      <input type="text" value={setForm.adminPassword} onChange={e => setSetForm({...setForm, adminPassword: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-xl font-bold outline-none focus:border-blue-600 transition-all" />
                   </div>
                </div>
             </div>

             <button type="submit" disabled={isUpdating} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all">
               {isUpdating ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
             </button>
          </form>
        </div>
      )}

      {activeTab === 'EXPORT' && (
        <div className="max-w-2xl bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-8">
           <h3 className="text-2xl font-black uppercase tracking-tight italic">ดาวน์โหลดข้อมูลบุคลากร</h3>
           <p className="text-slate-400 text-sm">เลือกรูปแบบไฟล์ที่ต้องการดาวน์โหลด (เป็นไฟล์ .txt)</p>
           
           <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleExport('NAME')}
                className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all group"
              >
                 <div className="text-left">
                   <h4 className="font-black text-lg group-hover:text-blue-400">เฉพาะรายชื่อ</h4>
                   <p className="text-xs text-slate-500 uppercase font-bold">Names only</p>
                 </div>
                 <i className="fas fa-file-download text-xl text-slate-700 group-hover:text-blue-500"></i>
              </button>

              <button 
                onClick={() => handleExport('SCHOOL')}
                className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all group"
              >
                 <div className="text-left">
                   <h4 className="font-black text-lg group-hover:text-blue-400">รายชื่อ + โรงเรียน</h4>
                   <p className="text-xs text-slate-500 uppercase font-bold">Names and Schools</p>
                 </div>
                 <i className="fas fa-file-download text-xl text-slate-700 group-hover:text-blue-500"></i>
              </button>

              <button 
                onClick={() => handleExport('FULL')}
                className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all group"
              >
                 <div className="text-left">
                   <h4 className="font-black text-lg group-hover:text-blue-400">รายชื่อ + โรงเรียน + กลุ่ม</h4>
                   <p className="text-xs text-slate-500 uppercase font-bold">Full Data (Names, Schools, Groups)</p>
                 </div>
                 <i className="fas fa-file-download text-xl text-slate-700 group-hover:text-blue-500"></i>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
