
import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '../types';

interface LuckyWheelProps {
  staff: Staff[];
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ staff }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Staff | null>(null);
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#2563eb', '#4f46e5', '#7c3aed', '#059669', '#d97706', '#e11d48',
    '#0ea5e9', '#6366f1', '#a855f7', '#10b981', '#f59e0b', '#f43f5e'
  ];

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
    if (isSpinning || isWaiting || staff.length === 0) return;

    setIsSpinning(true);
    setIsWaiting(false);
    setWinner(null);
    setShowWinnerCard(false);
    
    const randomIndex = Math.floor(Math.random() * staff.length);
    const selected = staff[randomIndex];
    
    const sliceAngle = 360 / staff.length;
    const targetSliceRotation = 360 - (randomIndex * sliceAngle) - (sliceAngle / 2);
    
    const extraRounds = 15 + Math.floor(Math.random() * 5);
    const newRotation = rotation + (360 * extraRounds) + (targetSliceRotation - (rotation % 360));
    
    setRotation(newRotation);

    const spinDuration = 10000;

    setTimeout(() => {
      setIsSpinning(false);
      setIsWaiting(true);
      setWinner(selected);

      setTimeout(() => {
        setShowWinnerCard(true);
        setIsWaiting(false);
      }, 3000);
    }, spinDuration); 
  };

  const generateWheelBackground = () => {
    if (staff.length === 0) return 'slate-900';
    if (staff.length === 1) return `conic-gradient(${colors[0]} 0deg 360deg)`;

    const sliceAngle = 360 / staff.length;
    let gradientParts: string[] = [];
    
    const step = staff.length > 1200 ? 8 : staff.length > 800 ? 5 : staff.length > 400 ? 2 : 1; 
    for (let i = 0; i < staff.length; i += step) {
      const color = colors[i % colors.length];
      gradientParts.push(`${color} ${i * sliceAngle}deg ${(i + step) * sliceAngle}deg`);
    }
    
    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  const getLabelFontSize = () => {
    if (staff.length > 1400) return '2.5px';
    if (staff.length > 1200) return '3px';
    if (staff.length > 900) return '4px';
    if (staff.length > 600) return '5px';
    if (staff.length > 300) return '6px';
    if (staff.length > 150) return '8px';
    if (staff.length > 80) return '10px';
    return '14px';
  };

  const getWinnerFontSize = (name: string) => {
    const len = name.length;
    if (len > 45) return '1.2rem';
    if (len > 35) return '1.5rem';
    if (len > 25) return '2.0rem';
    if (len > 18) return '2.4rem';
    return '3.5rem';
  };

  return (
    <div className={`relative flex items-center justify-center transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950 p-0 m-0 overflow-hidden h-screen w-screen' : 'min-h-[850px] py-16 flex-col'}`}>
      
      {!isFullscreen && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
          <div className="w-[1200px] h-[1200px] border-[100px] border-blue-500 rounded-full animate-spin-slow"></div>
        </div>
      )}

      <div className={`relative flex items-center justify-center transition-transform duration-700 ${isFullscreen ? 'scale-110' : 'scale-95 md:scale-100'}`}>
        
        <button 
          onClick={toggleFullscreen}
          className="absolute -top-16 -right-16 w-12 h-12 bg-slate-800/80 hover:bg-blue-600 rounded-2xl flex items-center justify-center text-white transition-all z-40 border border-slate-700 shadow-xl no-print"
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>

        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-40 ring-4 ring-blue-600">
           <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[40px] border-t-blue-600 absolute -bottom-9"></div>
           <i className="fas fa-star text-blue-600 text-3xl animate-pulse"></i>
        </div>

        <div 
          ref={wheelRef}
          className="w-[580px] h-[580px] md:w-[700px] md:h-[700px] rounded-full border-[20px] border-slate-900 shadow-[0_0_120px_rgba(37,99,235,0.4)] flex items-center justify-center overflow-hidden transition-transform ease-[cubic-bezier(0.1,0,0.1,1)] duration-[10000ms] relative"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: generateWheelBackground()
          }}
        >
          {staff.length <= 1500 && staff.map((s: Staff, i: number) => {
            const sliceAngle = 360 / staff.length;
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
                    width: isFullscreen ? '260px' : '240px', 
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

          <div className="w-44 h-44 bg-slate-950 rounded-full flex items-center justify-center border-4 border-white/20 z-30 shadow-[inset_0_0_50px_rgba(0,0,0,1)] relative">
            <button
              onClick={spin}
              disabled={isSpinning || isWaiting || staff.length === 0}
              className={`w-36 h-36 rounded-full font-black text-2xl uppercase tracking-tighter flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                isSpinning || isWaiting 
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed border-2 border-slate-800 shadow-none' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:scale-110 active:scale-95 border-4 border-blue-400/30 ring-8 ring-blue-500/10'
              }`}
            >
              <i className={`fas ${isSpinning ? 'fa-sync fa-spin' : isWaiting ? 'fa-stopwatch' : 'fa-play-circle'} mb-1 text-4xl`}></i>
              <span className="text-xs tracking-widest">{isSpinning ? 'สุ่ม...' : isWaiting ? 'รอ' : 'เริ่มหมุน'}</span>
            </button>
          </div>
        </div>
      </div>

      {!isFullscreen && (
        <div className="mt-12 text-center animate-in fade-in duration-1000">
           {isSpinning ? (
             <p className="text-blue-400 font-black uppercase tracking-[0.5em] animate-pulse text-xl">กำลังประมวลผลการสุ่ม...</p>
           ) : isWaiting ? (
             <p className="text-yellow-400 font-black uppercase tracking-[0.3em] animate-bounce text-xl">หยุดแล้ว! กำลังตรวจสอบรายชื่อผู้โชคดี...</p>
           ) : (
             <div className="bg-slate-900/40 px-8 py-4 rounded-3xl border border-slate-800 inline-block shadow-lg">
               <p className="text-slate-500 font-black uppercase tracking-widest text-xs">คลิกปุ่ม "เริ่มหมุน" ที่ศูนย์กลางวงล้อ ({staff.length} ท่าน)</p>
             </div>
           )}
        </div>
      )}

      {showWinnerCard && winner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 animate-in zoom-in-95 fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setShowWinnerCard(false)}></div>
           
           <div className="relative bg-white/5 backdrop-blur-3xl p-6 md:p-12 rounded-[3rem] md:rounded-[5rem] border-2 border-white/20 shadow-[0_0_250px_rgba(37,99,235,0.4)] text-center max-w-[95vw] md:max-w-6xl w-full flex flex-col items-center overflow-hidden">
              <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/20 blur-[120px] rounded-full"></div>
              
              <div className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-br from-yellow-300 to-orange-600 text-slate-950 rounded-full flex items-center justify-center mb-6 md:mb-10 shadow-[0_0_80px_rgba(251,191,36,0.6)] animate-bounce">
                 <i className="fas fa-trophy text-3xl md:text-6xl"></i>
              </div>
              
              <p className="text-amber-400 font-black uppercase tracking-[0.6em] md:tracking-[0.8em] text-sm md:text-xl mb-6 italic drop-shadow-lg">ขอแสดงความยินดีด้วย!</p>
              
              <div className="space-y-4 md:space-y-8 mb-8 md:mb-16 w-full px-4">
                 <h3 
                   className="font-black text-white tracking-tighter drop-shadow-2xl leading-none whitespace-nowrap overflow-hidden text-ellipsis mx-auto w-full block"
                   style={{ 
                     fontSize: getWinnerFontSize(winner.name)
                   }}
                 >
                   {winner.name}
                 </h3>
                 <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mt-4">
                    <div className="px-6 py-2.5 bg-blue-600/20 rounded-full text-sm md:text-xl font-black text-blue-300 border border-blue-500/30 backdrop-blur-md">
                      ร.ร.{winner.school}
                    </div>
                    <div className="px-6 py-2.5 bg-emerald-600/20 rounded-full text-sm md:text-xl font-black text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                      กลุ่ม{winner.group}
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowWinnerCard(false)} 
                className="bg-white text-slate-950 px-12 md:px-24 py-4 md:py-6 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-blue-50 transition-all active:scale-95 text-sm md:text-2xl"
              >
                รับทราบ
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
