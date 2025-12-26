
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
  const [useLocalStorage, setUseLocalStorage] = useState(!isConfigValid);

  useEffect(() => {
    fetchData();
  }, [useLocalStorage]);

  const fetchData = async () => {
    setLoading(true);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection Timeout")), 5000)
    );

    if (!useLocalStorage && db) {
      try {
        const fetchPromise = (async () => {
          const templatesCol = collection(db, 'templates');
          const templatesSnapshot = await getDocs(query(templatesCol, orderBy('created_at', 'desc')));
          const templatesList = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AwardTemplate));

          const recipientsCol = collection(db, 'recipients');
          const recipientsSnapshot = await getDocs(recipientsCol);
          const grouped: Record<string, Recipient[]> = {};
          recipientsSnapshot.docs.forEach((doc) => {
            const r = doc.data() as Recipient;
            const rid = doc.id;
            if (!grouped[r.templateId]) grouped[r.templateId] = [];
            grouped[r.templateId].push({ ...r, id: rid });
          });

          const presetsCol = collection(db, 'presets');
          const presetsSnapshot = await getDocs(presetsCol);
          let presetsList = presetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AwardPreset));
          
          if (presetsList.length === 0) {
            for (const text of INITIAL_AWARD_PRESETS) {
              await addDoc(collection(db, 'presets'), { text });
            }
            const freshSnapshot = await getDocs(presetsCol);
            presetsList = freshSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AwardPreset));
          }

          // ตรวจสอบหรือสร้าง Admin Config เริ่มต้น
          const adminDoc = await getDoc(doc(db, 'config', 'admin'));
          if (!adminDoc.exists()) {
            await setDoc(doc(db, 'config', 'admin'), { username: 'admin', password: '1234' });
          }

          return { templatesList, grouped, presetsList };
        })();

        const result = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        setTemplates(result.templatesList);
        setRecipients(result.grouped);
        setPresets(result.presetsList);
      } catch (err) {
        setUseLocalStorage(true);
      } finally {
        setLoading(false);
      }
    } else {
      const localTemplates = JSON.parse(localStorage.getItem('mnr_templates') || '[]');
      const localRecipients = JSON.parse(localStorage.getItem('mnr_recipients') || '{}');
      let localPresets = JSON.parse(localStorage.getItem('mnr_presets') || '[]');
      
      if (localPresets.length === 0) {
        localPresets = INITIAL_AWARD_PRESETS.map((text, i) => ({ id: i.toString(), text }));
        localStorage.setItem('mnr_presets', JSON.stringify(localPresets));
      }

      // Local Admin
      if (!localStorage.getItem('mnr_admin')) {
        localStorage.setItem('mnr_admin', JSON.stringify({ username: 'admin', password: '1234' }));
      }
      
      setTemplates(localTemplates);
      setRecipients(localRecipients);
      setPresets(localPresets);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = false;
    
    if (!useLocalStorage && db) {
      const adminDoc = await getDoc(doc(db, 'config', 'admin'));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        if (data.username === loginForm.user && data.password === loginForm.pass) {
          valid = true;
        }
      }
    } else {
      const admin = JSON.parse(localStorage.getItem('mnr_admin') || '{"username":"admin","password":"1234"}');
      if (admin.username === loginForm.user && admin.password === loginForm.pass) {
        valid = true;
      }
    }

    if (valid) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginForm({ user: '', pass: '' });
    } else {
      alert('Username หรือ Password ไม่ถูกต้อง');
    }
  };

  const handleSaveTemplate = async (updatedTemplate: AwardTemplate) => {
    if (!useLocalStorage && db) {
      try {
        const { id, ...payload } = updatedTemplate;
        await setDoc(doc(db, 'templates', id), { ...payload, created_at: new Date().toISOString() }, { merge: true });
        fetchData();
      } catch (err) { alert('บันทึกไม่สำเร็จ'); }
    } else {
      const newList = [...templates.filter(t => t.id !== updatedTemplate.id), updatedTemplate];
      localStorage.setItem('mnr_templates', JSON.stringify(newList));
      setTemplates(newList);
    }
  };

  const handleAddRecipient = async (newRecipient: Recipient) => {
    if (!useLocalStorage && db) {
      try {
        const { id, ...payload } = newRecipient;
        await addDoc(collection(db, 'recipients'), payload);
        fetchData();
      } catch (err) { alert('เพิ่มรายชื่อไม่สำเร็จ'); }
    } else {
      const current = { ...recipients };
      if (!current[newRecipient.templateId]) current[newRecipient.templateId] = [];
      current[newRecipient.templateId].push(newRecipient);
      localStorage.setItem('mnr_recipients', JSON.stringify(current));
      setRecipients(current);
    }
  };

  const handleDeleteRecipient = async (recipientId: string, templateId: string) => {
    if (!useLocalStorage && db) {
      try {
        await deleteDoc(doc(db, 'recipients', recipientId));
        fetchData();
      } catch (err) { console.error(err); }
    } else {
      const current = { ...recipients };
      current[templateId] = current[templateId].filter(r => r.id !== recipientId);
      localStorage.setItem('mnr_recipients', JSON.stringify(current));
      setRecipients(current);
    }
  };

  const handleSavePreset = async (text: string) => {
    if (!useLocalStorage && db) {
      try { await addDoc(collection(db, 'presets'), { text }); fetchData(); } catch (err) {}
    } else {
      const newPresets = [...presets, { id: Date.now().toString(), text }];
      localStorage.setItem('mnr_presets', JSON.stringify(newPresets));
      setPresets(newPresets);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!useLocalStorage && db) {
      try { await deleteDoc(doc(db, 'presets', id)); fetchData(); } catch (err) {}
    } else {
      const newPresets = presets.filter(p => p.id !== id);
      localStorage.setItem('mnr_presets', JSON.stringify(newPresets));
      setPresets(newPresets);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      <header className="bg-slate-950 text-white shadow-xl no-print border-b-4 border-blue-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => (window.location.href = '/')}>
            <div className="w-11 h-11 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-all border-b-2 border-blue-900">
                <i className="fas fa-certificate text-xl text-white"></i>
            </div>
            <div>
                <h1 className="text-lg font-black tracking-tight text-white leading-none">MNR E-SYSTEM</h1>
                <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mt-0.5">Muang Nang Rong Group</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`hidden md:flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black shadow-inner border-b-2 ${useLocalStorage ? 'bg-amber-700 text-white border-amber-900' : 'bg-emerald-700 text-white border-emerald-900'}`}>
              <i className={`fas ${useLocalStorage ? 'fa-database' : 'fa-cloud'} mr-2`}></i> 
              {useLocalStorage ? 'LOCAL MODE' : 'CLOUD CONNECTED'}
            </span>
            {isAdmin ? (
               <button
                onClick={() => setIsAdmin(false)}
                className="bg-rose-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border-b-2 active:scale-95 border-rose-900"
              >
                <i className="fas fa-sign-out-alt mr-2" /> Logout
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="bg-white text-slate-950 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border-b-2 active:scale-95 border-slate-300 hover:bg-slate-50"
              >
                <i className="fas fa-user-lock mr-2" /> Admin Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-950">กำลังเข้าสู่ระบบ...</h2>
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
            isCloud={!useLocalStorage}
          />
        ) : (
          <PublicSearch templates={templates} recipients={recipients} />
        )}
      </main>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border-2 border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                 <i className="fas fa-key text-2xl"></i>
               </div>
               <h3 className="text-xl font-black text-slate-950">เจ้าหน้าที่ดูแลระบบ</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Access Only</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Username</label>
                  <input 
                    type="text" 
                    className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-950 outline-none focus:border-blue-700 focus:bg-white"
                    value={loginForm.user}
                    onChange={e => setLoginForm({...loginForm, user: e.target.value})}
                    required
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Password</label>
                  <input 
                    type="password" 
                    className="w-full border-2 border-slate-200 bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-950 outline-none focus:border-blue-700 focus:bg-white"
                    value={loginForm.pass}
                    onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                    required
                  />
               </div>
               <div className="flex gap-3 pt-2">
                 <button 
                  type="button" 
                  onClick={() => setShowLogin(false)}
                  className="flex-1 px-4 py-4 rounded-xl font-black text-[10px] text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                 >
                   ยกเลิก
                 </button>
                 <button 
                  type="submit" 
                  className="flex-[2] bg-blue-700 text-white py-4 rounded-xl font-black text-[10px] hover:bg-blue-800 shadow-xl border-b-2 border-blue-950 uppercase tracking-widest"
                 >
                   Login Now
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-950 text-white py-8 no-print border-t-4 border-slate-900">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
            ระบบเกียรติบัตรออนไลน์ &copy; {new Date().getFullYear() + 543} กลุ่มโรงเรียนเมืองนางรอง <br/>
            บุรีรัมย์ เขต 3
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
