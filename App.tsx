
import React, { useState, useEffect } from 'react';
import { AwardTemplate, Recipient, AwardPreset, INITIAL_AWARD_PRESETS } from './types.ts';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { PublicSearch } from './components/PublicSearch.tsx';
import { 
  db, 
  isConfigValid, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  getDoc
} from './firebaseConfig.ts';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [templates, setTemplates] = useState<AwardTemplate[]>([]);
  const [recipients, setRecipients] = useState<Record<string, Recipient[]>>({});
  const [presets, setPresets] = useState<AwardPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');

  useEffect(() => {
    const init = async () => {
      if (isConfigValid && db) {
        await fetchData();
      } else {
        setDbStatus('ERROR');
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // 1. Templates
      const templatesCol = collection(db, 'templates');
      const templatesSnapshot = await getDocs(query(templatesCol, orderBy('created_at', 'desc')));
      const templatesList = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AwardTemplate));

      // 2. Recipients
      const recipientsCol = collection(db, 'recipients');
      const recipientsSnapshot = await getDocs(recipientsCol);
      const grouped: Record<string, Recipient[]> = {};
      recipientsSnapshot.docs.forEach((doc) => {
        const r = doc.data() as Recipient;
        if (!grouped[r.templateId]) grouped[r.templateId] = [];
        grouped[r.templateId].push({ ...r, id: doc.id });
      });

      // 3. Presets
      const presetsCol = collection(db, 'presets');
      const presetsSnapshot = await getDocs(presetsCol);
      let presetsList = presetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AwardPreset));
      
      if (presetsList.length === 0) {
        for (const text of INITIAL_AWARD_PRESETS) {
          await addDoc(collection(db, 'presets'), { text });
        }
        const freshPresets = await getDocs(presetsCol);
        presetsList = freshPresets.docs.map(doc => ({ id: doc.id, ...doc.data() } as AwardPreset));
      }

      // 4. Admin
      const adminDoc = await getDoc(doc(db, 'config', 'admin'));
      if (!adminDoc.exists()) {
        await setDoc(doc(db, 'config', 'admin'), { username: 'admin', password: '1234' });
      }

      setTemplates(templatesList);
      setRecipients(grouped);
      setPresets(presetsList);
      setDbStatus('CONNECTED');
    } catch (err) {
      console.error("Firebase Error:", err);
      setDbStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      const adminDoc = await getDoc(doc(db, 'config', 'admin'));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        if (data.username === loginForm.user && data.password === loginForm.pass) {
          setIsAdmin(true);
          setShowLogin(false);
          setLoginForm({ user: '', pass: '' });
        } else {
          alert('Username หรือ Password ไม่ถูกต้อง');
        }
      }
    } catch (err) {
      alert('เชื่อมต่อฐานข้อมูลล้มเหลว');
    }
  };

  const handleSaveTemplate = async (updatedTemplate: AwardTemplate) => {
    if (!db) return;
    try {
      const { id, ...payload } = updatedTemplate;
      await setDoc(doc(db, 'templates', id), { ...payload, created_at: new Date().toISOString() }, { merge: true });
      fetchData();
    } catch (err) { alert('บันทึกไม่สำเร็จ'); }
  };

  const handleAddRecipient = async (newRecipient: Recipient) => {
    if (!db) return;
    try {
      const { id, ...payload } = newRecipient;
      await addDoc(collection(db, 'recipients'), payload);
      fetchData();
    } catch (err) { alert('เพิ่มรายชื่อไม่สำเร็จ'); }
  };

  const handleDeleteRecipient = async (recipientId: string, templateId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'recipients', recipientId));
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleSavePreset = async (text: string) => {
    if (!db) return;
    try { await addDoc(collection(db, 'presets'), { text }); fetchData(); } catch (err) {}
  };

  const handleDeletePreset = async (id: string) => {
    if (!db) return;
    try { await deleteDoc(doc(db, 'presets', id)); fetchData(); } catch (err) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-950 text-white shadow-xl no-print border-b-4 border-blue-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => (window.location.href = '/')}>
            <div className="w-11 h-11 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg border-b-2 border-blue-900">
                <i className="fas fa-certificate text-xl text-white"></i>
            </div>
            <div>
                <h1 className="text-lg font-black tracking-tight text-white leading-none">MNR E-SYSTEM</h1>
                <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mt-0.5">Muang Nang Rong Group</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`hidden md:flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black shadow-inner border-b-2 ${dbStatus === 'CONNECTED' ? 'bg-emerald-700 border-emerald-900' : 'bg-rose-700 border-rose-900'}`}>
              <i className={`fas ${dbStatus === 'CONNECTED' ? 'fa-cloud' : 'fa-exclamation-triangle'} mr-2`}></i> 
              {dbStatus === 'CONNECTED' ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อล้มเหลว'}
            </span>
            {isAdmin ? (
               <button onClick={() => setIsAdmin(false)} className="bg-rose-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border-b-2 border-rose-900 active:scale-95">
                <i className="fas fa-sign-out-alt mr-2" /> ออกจากระบบ
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-white text-slate-950 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border-b-2 border-slate-300 hover:bg-slate-100 active:scale-95">
                <i className="fas fa-user-lock mr-2" /> สำหรับเจ้าหน้าที่
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-950">กำลังโหลดข้อมูลจาก Cloud...</h2>
          </div>
        ) : isAdmin ? (
          <AdminDashboard 
            templates={templates}
            recipients={recipients}
            presets={presets}
            onSaveTemplate={handleSaveTemplate}
            onAddRecipient={handleAddRecipient}
            onDeleteRecipient={handleDeleteRecipient}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            isCloud={true}
          />
        ) : (
          <PublicSearch templates={templates} recipients={recipients} />
        )}
      </main>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border-2 border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                 <i className="fas fa-key text-2xl"></i>
               </div>
               <h3 className="text-xl font-black text-slate-950">เข้าสู่ระบบจัดการ</h3>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Username</label>
                  <input type="text" className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-700 focus:bg-white" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} required />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Password</label>
                  <input type="password" className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-700 focus:bg-white" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} required />
               </div>
               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setShowLogin(false)} className="flex-1 px-4 py-4 rounded-xl font-black text-[10px] text-slate-400 uppercase tracking-widest">ยกเลิก</button>
                 <button type="submit" className="flex-[2] bg-blue-700 text-white py-4 rounded-xl font-black text-[10px] shadow-xl border-b-2 border-blue-950 uppercase tracking-widest">ตกลง</button>
               </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-950 text-white py-8 no-print border-t-4 border-slate-900">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
            ระบบเกียรติบัตรออนไลน์กลุ่มโรงเรียนเมืองนางรอง &copy; {new Date().getFullYear() + 543} <br/>
            (ระบบคลาวด์สมบูรณ์แบบ - ไม่ใช้งาน AI)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
