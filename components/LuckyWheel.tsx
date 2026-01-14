
import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '../types';

interface LuckyWheelProps {
  staff: Staff[];
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ staff }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Staff | null>(null);
  const [winnerHistory, setWinnerHistory] = useState<Staff[]>([]);
  
  // 'pool' tracks who hasn't won yet
  const [pool, setPool] = useState<Staff[]>(staff);
  // 'visualCandidates' is what is actually rendered on the wheel to prevent "jumping" after a win
  const [visualCandidates, setVisualCandidates] = useState<Staff[]>(staff);
  
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#2563eb', '#4f46e5', '#7c3aed', '#059669', '#d97706', '#e11d48',
    '#0ea5e9', '#6366f1', '#a855f7', '#10b981', '#f59e0b', '#f43f5e'
  ];

  // Initialize pool if staff changes (e.g. data loaded)
  useEffect(() => {
    if (staff.length > 0 && pool.length === 0 && winnerHistory.length === 0) {
      setPool(staff);
      setVisualCandidates(staff);
    }
  }, [staff]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => alert(e.message));
    } else {
      document.exitFullscreen();
    }
  };

  const spin = () => {
    if (isSpinning || isWaiting || pool.length === 0) return;

    // IMPORTANT: Sync visual wheel with current pool only when starting a NEW spin
    setVisualCandidates(pool);
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];
    
    const sliceAngle = 360 / pool.length;
    const targetSliceRotation = 360 - (randomIndex * sliceAngle) - (sliceAngle / 2);
    
    const extraRounds = 15 + Math.floor(Math.random() * 5);
    const newRotation = rotation + (360 * extraRounds) + (targetSliceRotation - (rotation % 360));
    
    setRotation(newRotation);
    setIsSpinning(true);
    setIsWaiting(false);
    setWinner(null);
    setShowWinnerCard(false);

    const spinDuration = 10000;

    setTimeout(() => {
      setIsSpinning(false);
      setIsWaiting(true);
      setWinner(selected);
      
      // We don't update history here anymore. 
      // We wait for the user to close the card.
      setPool(prev => prev.filter(c => c.id !== selected.id));

      setTimeout(() => {
        setShowWinnerCard(true);
        setIsWaiting(false);
      }, 2000); 
    }, spinDuration); 
  };

  const closeWinnerCard = () => {
    if (winner) {
      // Add winner to history only when closing the announcement
      setWinnerHistory(prev => [winner, ...prev]);
    }
    setShowWinnerCard(false);
    setWinner(null);
  };

  const clearHistory = () => {
    if (confirm('ยืนยันการเริ่มเกมใหม่ ล้างประวัติ และนำรายชื่อทั้งหมดกลับมาในวงล้อ?')) {
      setWinnerHistory([]);
      setPool(staff);
      setVisualCandidates(staff);
      setWinner(null);
      setShowWinnerCard(false);
    }
  };

  const generateWheelBackground = () => {
    if (visualCandidates.length === 0) return 'slate-900';
    if (visualCandidates.length === 1) return `conic-gradient(${colors[0]} 0deg 360deg)`;

    const sliceAngle = 360 / visualCandidates.length;
    let gradientParts: string[] = [];
    
    const step = visualCandidates.length > 1200 ? 8 : visualCandidates.length > 800 ? 5 : visualCandidates.length > 400 ? 2 : 1; 
    for (let i = 0; i < visualCandidates.length; i += step) {
      const color = colors[i % colors.length];
      gradientParts.push(`${color} ${i * sliceAngle}deg ${(i + step) * sliceAngle}deg`);
    }
    
    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  const getLabelFontSize = () => {
    if (visualCandidates.length > 1400) return '2.5px';
    if (visualCandidates.length > 1200) return '3px';
    if (visualCandidates.length > 900) return '4px';
    if (visualCandidates.length > 600) return '5px';
    if (visualCandidates.length > 300) return '6px';
    if (visualCandidates.length > 150) return '8px';
    if (visualCandidates.length > 80) return '10px';
    return '14px';
  };

  const getWinnerFontSize = (name: string) => {
    const len = name.length;
    if (len > 45) return '1.5rem';
    if (len > 35) return '2.0rem';
    if (len > 25) return '2.8rem';
    if (len > 18) return '4.0rem';
    return '5.5rem'; 
  };

  return (
    <div className={`relative flex flex-col lg:flex-row items-center justify-center transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950 p-0 m-0 overflow-hidden h-screen w-screen' : 'min-h-[850px] py-16'}`}>
      
      {!isFullscreen && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
          <div className="w-[1200px] h-[1200px] border-[100px] border-blue-500 rounded-full animate-spin-slow"></div>
        </div>
      )}

      {/* Main Wheel Section */}
      <div className={`flex-1 relative flex flex-col items-center justify-center transition-transform duration-700 ${isFullscreen ? 'scale-100' : 'scale-95 md:scale-100'}`}>
        
        <button 
          onClick={toggleFullscreen}
          className="absolute -top-16 -right-16 w-12 h-12 bg-slate-800/80 hover:bg-blue-600 rounded-2xl flex items-center justify-center text-white transition-all z-40 border border-slate-700 shadow-xl no-print"
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>

        {/* Pointer at the TOP */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-40 ring-4 ring-blue-600">
           <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[40px] border-t-blue-600 absolute -bottom-9"></div>
           <i className="fas fa-star text-blue-600 text-3xl animate-pulse"></i>
        </div>

        <div 
          ref={wheelRef}
          className="w-[500px] h-[500px] md:w-[650px] md:h-[650px] rounded-full border-[20px] border-slate-900 shadow-[0_0_120px_rgba(37,99,235,0.4)] flex items-center justify-center overflow-hidden transition-transform ease-[cubic-bezier(0.1,0,0.1,1)] duration-[10000ms] relative"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: generateWheelBackground()
          }}
        >
          {visualCandidates.length <= 1500 && visualCandidates.map((s: Staff, i: number) => {
            const sliceAngle = 360 / visualCandidates.length;
            const rotationAngle = (i * sliceAngle) + (sliceAngle / 2) - 90;
            return (
              <div 
                key={s.id}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"
                style={{ transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)` }}
              >
                <div 
                  className="absolute left-1/2 flex items-center justify-end"
                  style={{ 
                    width: isFullscreen ? '240px' : '220px', 
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'left center',
                    transform: 'translate(60px, -50%)' 
                  }}
                >
                  <span 
                    className="text-white font-normal whitespace-nowrap px-1 overflow-hidden text-ellipsis"
                    style={{ 
                      fontSize: getLabelFontSize(),
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                    }}
                  >
                    {s.name}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="w-40 h-40 bg-slate-950 rounded-full flex items-center justify-center border-4 border-white/20 z-30 shadow-[inset_0_0_50px_rgba(0,0,0,1)] relative">
            <button
              onClick={spin}
              disabled={isSpinning || isWaiting || pool.length === 0}
              className={`w-32 h-32 rounded-full font-black text-xl uppercase tracking-tighter flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                isSpinning || isWaiting 
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed border-2 border-slate-800 shadow-none' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:scale-110 active:scale-95 border-4 border-blue-400/30 ring-8 ring-blue-500/10'
              }`}
            >
              <i className={`fas ${isSpinning ? 'fa-sync fa-spin' : isWaiting ? 'fa-stopwatch' : 'fa-play-circle'} mb-1 text-3xl`}></i>
              <span className="text-[10px] tracking-widest">{isSpinning ? 'สุ่ม...' : isWaiting ? 'รอ' : 'เริ่มหมุน'}</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Winners Names-Only List (Right Side) */}
        {isFullscreen && winnerHistory.length > 0 && (
          <div className="fixed top-0 bottom-0 right-0 w-48 md:w-64 bg-slate-950/40 backdrop-blur-md p-6 z-50 animate-in slide-in-from-right-10 duration-700 overflow-y-auto custom-scrollbar border-l border-white/5">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 border-b border-blue-500/20 pb-2">ผู้โชคดี ({winnerHistory.length})</h4>
            <div className="flex flex-col gap-2">
              {winnerHistory.map((h, i) => (
                <div key={`${h.id}-${i}`} className="text-white font-bold text-[10px] md:text-xs py-1 border-b border-white/5 animate-in fade-in slide-in-from-right-2 duration-300">
                  {winnerHistory.length - i}. {h.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isFullscreen && (
          <div className="mt-8 text-center animate-in fade-in duration-1000">
             {isSpinning ? (
               <p className="text-blue-400 font-black uppercase tracking-[0.5em] animate-pulse text-lg">กำลังประมวลผลการสุ่ม...</p>
             ) : isWaiting ? (
               <p className="text-yellow-400 font-black uppercase tracking-[0.3em] animate-bounce text-lg">หยุดแล้ว! กำลังตรวจสอบรายชื่อผู้โชคดี...</p>
             ) : (
               <div className="bg-slate-900/40 px-6 py-3 rounded-2xl border border-slate-800 inline-block shadow-lg">
                 <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">รายชื่อในวงล้อเหลือ: {pool.length} ท่าน (จาก {staff.length})</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Sidebar (Only non-fullscreen) */}
      {!isFullscreen && (
        <div className="w-full lg:w-80 h-full max-h-[600px] lg:max-h-full flex flex-col transition-all duration-500 opacity-100">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] flex flex-col h-full shadow-2xl overflow-hidden mx-4">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-trophy text-yellow-500"></i> ทำเนียบผู้โชคดี
                </h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Winners Hall of Fame</p>
              </div>
              <button 
                onClick={clearHistory}
                title="เริ่มเกมใหม่ / ล้างประวัติ"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-all flex items-center justify-center text-xs"
              >
                <i className="fas fa-redo-alt"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {winnerHistory.length > 0 ? (
                winnerHistory.map((h, idx) => (
                  <div 
                    key={`${h.id}-${idx}`} 
                    className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col gap-1 animate-in slide-in-from-right-5 duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-500 uppercase">ลำดับที่ {winnerHistory.length - idx}</span>
                      <i className="fas fa-medal text-blue-500/50"></i>
                    </div>
                    <h4 className="font-black text-white text-base leading-tight truncate">{h.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">ร.ร.{h.school}</p>
                    <div className="mt-2 text-[9px] font-black uppercase px-2 py-0.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-md self-start">
                      กลุ่ม{h.group}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                  <i className="fas fa-users text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">ยังไม่มีรายชื่อผู้โชคดี</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-950/20 border-t border-slate-800 text-center">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Total Winners: {winnerHistory.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Winner Card Overlay - HEIGHT ADJUSTED (Compact) */}
      {showWinnerCard && winner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 animate-in zoom-in-95 fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={closeWinnerCard}></div>
           
           <div className="relative bg-white/5 backdrop-blur-3xl p-6 md:p-8 rounded-[2rem] md:rounded-[4rem] border-2 border-white/20 shadow-[0_0_200px_rgba(37,99,235,0.3)] text-center max-w-[95vw] md:max-w-5xl w-full flex flex-col items-center overflow-hidden min-h-[400px] justify-center">
              <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/20 blur-[120px] rounded-full"></div>
              
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-yellow-300 to-orange-600 text-slate-950 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_60px_rgba(251,191,36,0.5)] animate-bounce">
                 <i className="fas fa-trophy text-2xl md:text-4xl"></i>
              </div>
              
              <p className="text-amber-400 font-black uppercase tracking-[0.6em] md:tracking-[1.0em] text-[10px] md:text-xl mb-6 italic drop-shadow-lg">ขอแสดงความยินดีด้วย!</p>
              
              <div className="w-full px-4 flex flex-col items-center">
                 <h3 
                   className="font-black text-white tracking-tighter drop-shadow-2xl leading-tight whitespace-nowrap overflow-hidden text-ellipsis mx-auto max-w-full block py-4"
                   style={{ 
                     fontSize: getWinnerFontSize(winner.name)
                   }}
                 >
                   {winner.name}
                 </h3>
                 
                 <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mt-12 md:mt-20">
                    <div className="px-10 py-3 bg-blue-600/20 rounded-full text-lg md:text-2xl font-black text-blue-300 border border-blue-500/30 backdrop-blur-md shadow-xl">
                      ร.ร.{winner.school}
                    </div>
                    <div className="px-10 py-3 bg-emerald-600/20 rounded-full text-lg md:text-2xl font-black text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-xl">
                      กลุ่ม{winner.group}
                    </div>
                 </div>
              </div>

              {/* Smaller and sleeker Acknowledge button */}
              <button 
                onClick={closeWinnerCard} 
                className="bg-white text-slate-950 px-5 md:px-10 py-2 md:py-3 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-blue-50 transition-all active:scale-95 text-[8px] md:text-xs mt-16 border-b-2 border-slate-300"
              >
                รับทราบ
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
