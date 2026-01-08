
import React, { useState, useEffect } from 'react';
import { Staff, GroupName, SCHOOL_GROUPS, SystemSettings } from './types.ts';
import { LuckyWheel } from './components/LuckyWheel.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
} from './firebaseConfig.ts';

const GROUP_COLORS: Record<GroupName, string> = {
  'นครนางรอง': 'from-blue-600 to-blue-700',
  'เมืองนางรอง': 'from-indigo-600 to-indigo-700',
  'โบสถ์พระยาแสงทอง': 'from-purple-600 to-purple-700',
  'สะเดาไทรงาม': 'from-emerald-600 to-emerald-700',
  'หนองยายพิมพ์': 'from-amber-500 to-amber-600',
  'ลุ่มลำมาศ': 'from-rose-600 to-rose-700'
};

const App: React.FC = () => {
  const [view, setView] = useState<'HOME' | 'REGISTER' | 'WHEEL' | 'ADMIN'>('HOME');
  const [activeGroup, setActiveGroup] = useState<GroupName | null>(null);
  const [activeSchool, setActiveSchool] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    regEnabled: true,
    editLocked: false,
    spinPassword: '8888',
    adminPassword: '1234',
    adminUser: 'admin'
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authNeeded, setAuthNeeded] = useState<'NONE' | 'WHEEL' | 'ADMIN'>('NONE');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchData();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const fetchData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const staffSnapshot = await getDocs(collection(db, 'staff'));
      const list = staffSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      setStaffList(list);

      const settingsDoc = await getDoc(doc(db, 'config', 'system'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as SystemSettings);
      } else {
        await setDoc(doc(db, 'config', 'system'), settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkPassword = () => {
    if (authNeeded === 'WHEEL' && passwordInput === settings.spinPassword) {
      setView('WHEEL');
      setAuthNeeded('NONE');
      setPasswordInput('');
    } else if (authNeeded === 'ADMIN' && passwordInput === settings.adminPassword) {
      setIsAdmin(true);
      setView('ADMIN');
      setAuthNeeded('NONE');
      setPasswordInput('');
    } else {
      alert('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (settings.editLocked && !isAdmin) {
      alert('ระบบถูกล็อคการแก้ไขโดยผู้ดูแลระบบ');
      return;
    }
    if (!confirm('ยืนยันการลบรายชื่อนี้?')) return;
    try {
      await deleteDoc(doc(db, 'staff', id));
      fetchData();
    } catch (e) { alert('ลบไม่สำเร็จ'); }
  };

  const handleEditStaff = async (id: string, currentName: string) => {
    if (settings.editLocked && !isAdmin) {
      alert('ระบบถูกล็อคการแก้ไขโดยผู้ดูแลระบบ');
      return;
    }
    const newName = prompt('แก้ไขชื่อบุคลากร:', currentName);
    if (newName && newName !== currentName) {
      try {
        await updateDoc(doc(db, 'staff', id), { name: newName });
        fetchData();
      } catch (e) { alert('แก้ไขไม่สำเร็จ'); }
    }
  };

  const handleDeleteSchool = async (schoolName: string, group: GroupName) => {
    if (settings.editLocked && !isAdmin) {
      alert('ระบบถูกล็อคการแก้ไขโดยผู้ดูแลระบบ');
      return;
    }
    if (!confirm(`ยืนยันการลบโรงเรียน "${schoolName}" และรายชื่อทั้งหมดในโรงเรียนนี้?`)) return;
    const targets = staffList.filter(s => s.school === schoolName && s.group === group);
    try {
      for (const t of targets) {
        await deleteDoc(doc(db, 'staff', t.id));
      }
      fetchData();
      setActiveSchool(null);
    } catch (e) { alert('ลบไม่สำเร็จ'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-blue-400 font-black animate-pulse uppercase tracking-widest text-sm">กำลังโหลดระบบ...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Sarabun'] selection:bg-blue-500 selection:text-white pb-20">
      {/* Hide header in fullscreen wheel view */}
      {!(view === 'WHEEL' && isFullscreen) && (
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setView('HOME'); setActiveGroup(null); setActiveSchool(null); }}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20">
                <i className="fas fa-dharmachakra text-lg animate-spin-slow"></i>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter leading-none uppercase">วงล้อโชคดีนางรอง</h1>
                <p className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em] mt-0.5">ระบบบุคลากร อำเภอนางรอง</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAuthNeeded('WHEEL')} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
                หมุนวงล้อ
              </button>
              <button onClick={() => isAdmin ? setView('ADMIN') : setAuthNeeded('ADMIN')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ring-1 ${isAdmin ? 'bg-blue-600 ring-blue-400 shadow-lg' : 'bg-slate-800 ring-slate-700'}`}>
                <i className="fas fa-cog text-sm"></i>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`${(view === 'WHEEL' && isFullscreen) ? 'p-0' : 'container mx-auto px-6 py-10 max-w-7xl'}`}>
        {view === 'HOME' && !activeGroup && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Total Banner - District Summary */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-10 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl font-black tracking-tighter italic mb-2">ข้อมูลบุคลากรอำเภอนางรอง</h2>
                  <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs">สรุปข้อมูลทั้ง 6 กลุ่มโรงเรียนในสังกัด</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-8">
                    <div className="flex flex-col">
                       <span className="text-5xl font-black text-white">{staffList.length}</span>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">บุคลากรทั้งหมด</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-700 pl-8">
                       <span className="text-5xl font-black text-blue-500">{new Set(staffList.map(s => s.school)).size}</span>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">โรงเรียนทั้งหมด</span>
                    </div>
                  </div>
                </div>
                {settings.regEnabled && (
                  <button onClick={() => setView('REGISTER')} className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all text-sm active:scale-95 shadow-blue-600/30">
                    ลงชื่อร่วมกิจกรรม
                  </button>
                )}
              </div>
            </div>

            {/* Compact Group Cards - Larger Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SCHOOL_GROUPS.map((group) => {
                const groupStaff = staffList.filter(s => s.group === group);
                const schoolCount = new Set(groupStaff.map(s => s.school)).size;
                return (
                  <div 
                    key={group} 
                    onClick={() => setActiveGroup(group)}
                    className={`bg-gradient-to-br ${GROUP_COLORS[group]} p-8 rounded-[2.5rem] shadow-2xl cursor-pointer hover:-translate-y-3 transition-all group relative overflow-hidden min-h-[220px] flex flex-col justify-between`}
                  >
                    <div className="absolute top-6 right-6 opacity-10 group-hover:scale-125 transition-transform duration-500">
                      <i className="fas fa-school text-7xl"></i>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black leading-tight mb-4 border-l-4 border-white/30 pl-4">กลุ่ม{group}</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                          <span className="text-[10px] font-bold uppercase opacity-80">โรงเรียนในกลุ่ม</span>
                          <span className="text-xl font-black">{schoolCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                          <span className="text-[10px] font-bold uppercase opacity-80">บุคลากรทั้งหมด</span>
                          <span className="text-xl font-black">{groupStaff.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>จัดการรายชื่อ</span>
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Level 1: Schools in Group */}
        {view === 'HOME' && activeGroup && !activeSchool && (
          <div className="animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
               <button onClick={() => setActiveGroup(null)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg"><i className="fas fa-arrow-left"></i></button>
               <div>
                 <h2 className="text-3xl font-black italic tracking-tighter">กลุ่ม {activeGroup}</h2>
                 <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">เลือกโรงเรียนเพื่อจัดการบุคลากร</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from(new Set(staffList.filter(s => s.group === activeGroup).map(s => s.school))).sort().map(schoolName => {
                const schoolStaff = staffList.filter(s => s.school === schoolName && s.group === activeGroup);
                return (
                  <div 
                    key={schoolName}
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-[2rem] group relative hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer shadow-lg"
                    onClick={() => setActiveSchool(schoolName)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black mb-2 group-hover:text-blue-400 transition-colors leading-tight">{schoolName}</h4>
                        <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 inline-block">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{schoolStaff.length} ท่าน</p>
                        </div>
                      </div>
                      {(!settings.editLocked || isAdmin) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSchool(schoolName, activeGroup); }}
                          className="w-8 h-8 rounded-lg bg-rose-600/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 hover:text-white"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Level 2: Staff in School */}
        {view === 'HOME' && activeGroup && activeSchool && (
          <div className="animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4 mb-8">
               <button onClick={() => setActiveSchool(null)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg"><i className="fas fa-arrow-left"></i></button>
               <div>
                 <h2 className="text-3xl font-black italic tracking-tighter">{activeSchool}</h2>
                 <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">สังกัดกลุ่ม {activeGroup}</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ลำดับ</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ชื่อ-นามสกุล</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {staffList.filter(s => s.school === activeSchool && s.group === activeGroup).map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-800/50 transition-all group">
                      <td className="px-8 py-4 font-bold text-slate-600 text-xs">{idx + 1}</td>
                      <td className="px-8 py-4">
                        <span className="font-black text-lg">{s.name}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        {(!settings.editLocked || isAdmin) && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditStaff(s.id, s.name)} className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                              <i className="fas fa-edit text-xs"></i>
                            </button>
                            <button onClick={() => handleDeleteStaff(s.id)} className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                              <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {staffList.filter(s => s.school === activeSchool && s.group === activeGroup).length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs">ไม่มีรายชื่อบุคลากรในโรงเรียนนี้</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'REGISTER' && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-10 duration-500">
            <button onClick={() => setView('HOME')} className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all">
              <i className="fas fa-arrow-left"></i> กลับหน้าหลัก
            </button>
            <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
              <h2 className="text-3xl font-black mb-8 border-l-4 border-blue-600 pl-6 uppercase tracking-tighter">ลงชื่อบุคลากร</h2>
              <RegistrationForm onSuccess={() => { fetchData(); setView('HOME'); }} groups={SCHOOL_GROUPS} />
            </div>
          </div>
        )}

        {view === 'WHEEL' && <LuckyWheel staff={staffList} />}

        {view === 'ADMIN' && (
          <AdminPanel staff={staffList} settings={settings} onDataChange={fetchData} onBack={() => { setView('HOME'); setIsAdmin(false); }} />
        )}
      </main>

      {/* Auth Modal */}
      {authNeeded !== 'NONE' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 p-6">
          <div className="bg-slate-900 w-full max-w-sm p-10 rounded-[3rem] border border-slate-800 shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-500/30">
              <i className="fas fa-lock text-2xl"></i>
            </div>
            <h3 className="text-xl font-black mb-1 uppercase tracking-tight">เข้าสู่ระบบความปลอดภัย</h3>
            <p className="text-slate-500 text-[10px] font-bold mb-8 uppercase tracking-widest">กรุณากรอกรหัสผ่านเพื่อดำเนินการต่อ</p>
            <input 
              type="password" autoFocus
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-blue-600 transition-all mb-6" 
              placeholder="••••" value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkPassword()}
            />
            <div className="flex gap-4">
              <button onClick={() => setAuthNeeded('NONE')} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">ยกเลิก</button>
              <button onClick={checkPassword} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RegistrationForm: React.FC<{ onSuccess: () => void, groups: GroupName[] }> = ({ onSuccess, groups }) => {
  const [formData, setFormData] = useState({ school: '', group: groups[0], names: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.school || !formData.names.trim()) return;
    setIsSubmitting(true);
    try {
      const namesList = formData.names.split('\n').map(n => n.trim()).filter(n => n !== '');
      for (const name of namesList) {
        await addDoc(collection(db, 'staff'), {
          name,
          school: formData.school.trim(),
          group: formData.group,
          created_at: new Date().toISOString()
        });
      }
      onSuccess();
    } catch (e) { alert('เกิดข้อผิดพลาด'); } finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">กลุ่มโรงเรียน</label>
        <select value={formData.group} onChange={e => setFormData({...formData, group: e.target.value as GroupName})} className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all">
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ชื่อโรงเรียน</label>
        <input type="text" required value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all" placeholder="เช่น ร.ร.บ้านนางรอง" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">รายชื่อบุคลากร (แยกทีละบรรทัด)</label>
        <textarea required value={formData.names} onChange={e => setFormData({...formData, names: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all min-h-[160px]" placeholder="เช่น&#10;นายสมชาย ใจดี&#10;นางสาวรักเรียน หมั่นเพียร" />
      </div>
      <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all ${isSubmitting ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-600/20'}`}>
        {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกรายชื่อ'}
      </button>
    </form>
  );
};

export default App;
