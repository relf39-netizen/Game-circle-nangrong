
import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '../types.ts';

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
    
    const extraRounds = 10 + Math.floor(Math.random() * 5);
    const newRotation = rotation + (360 * extraRounds) + (targetSliceRotation - (rotation % 360));
    
    setRotation(newRotation);

    const spinDuration = 10000;

    setTimeout(() => {
      setIsSpinning(false);
      setIsWaiting(true);
      setWinner(selected);

      // หน่วงเวลา 4 วินาทีให้คนดูรายชื่อที่เข็มชี้
      setTimeout(() => {
        setShowWinnerCard(true);
        setIsWaiting(false);
      }, 4000);
    }, spinDuration); 
  };

  const generateWheelBackground = () => {
    if (staff.length === 0) return 'slate-900';
    if (staff.length === 1) return `conic-gradient(${colors[0]} 0deg 360deg)`;

    const sliceAngle = 360 / staff.length;
    let gradientParts = [];
    
    // หากจำนวนคนเยอะมาก จะสลับสีแบบละเอียด
    const step = staff.length > 500 ? 4 : 1; 
    for (let i = 0; i < staff.length; i += step) {
      const color = colors[i % colors.length];
      gradientParts.push(`${color} ${i * sliceAngle}deg ${(i + step) * sliceAngle}deg`);
    }
    
    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950 p-0 m-0 overflow-hidden' : 'min-h-[750px] py-6'}`}>
      
      {/* Background Decor */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
        <div className="w-[1000px] h-[1000px] border-[80px] border-blue-500 rounded-full animate-spin-slow"></div>
      </div>

      <div className={`relative z-10 transition-transform duration-700 ${isFullscreen ? 'scale-100' : 'scale-90 md:scale-100'}`}>
        
        {/* Fullscreen Trigger */}
        <button 
          onClick={toggleFullscreen}
          className="absolute -top-12 -right-12 w-10 h-10 bg-slate-800/80 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-all z-40 border border-slate-700 shadow-xl"
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>

        {/* เข็มชี้ (Pointer) */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 ring-4 ring-blue-600">
           <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-blue-600 absolute -bottom-7"></div>
           <i className="fas fa-arrow-down text-blue-600 text-2xl"></i>
        </div>

        {/* แผ่นวงล้อ - ขนาดที่ปรับใหม่ 500px-600px */}
        <div 
          ref={wheelRef}
          className="w-[500px] h-[500px] md:w-[600px] md:h-[600px] rounded-full border-[15px] border-slate-900 shadow-[0_0_80px_rgba(37,99,235,0.3)] flex items-center justify-center overflow-hidden transition-transform ease-[cubic-bezier(0.1,0,0.1,1)] duration-[10000ms] relative"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: generateWheelBackground()
          }}
        >
          {/* รายชื่อบุคลากร (Radial Alignment) */}
          {staff.length <= 400 && staff.map((s, i) => {
            const sliceAngle = 360 / staff.length;
            const rotationAngle = (i * sliceAngle) + (sliceAngle / 2);
            return (
              <div 
                key={s.id}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"
                style={{ transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)` }}
              >
                <div 
                  className="absolute left-1/2 flex items-center justify-end"
                  style={{ 
                    width: isFullscreen ? '280px' : '230px', 
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'left center',
                    transform: 'translate(45px, -50%)' 
                  }}
                >
                  <span 
                    className="text-white font-black whitespace-nowrap px-4"
                    style={{ 
                      fontSize: staff.length > 200 ? '6px' : staff.length > 100 ? '8px' : '12px',
                      textShadow: '0 2px 4px rgba(0,0,0,1)'
                    }}
                  >
                    {s.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* ปุ่มเริ่มหมุนตรงกลาง (Central Spin Button) */}
          <div className="w-36 h-36 bg-slate-950 rounded-full flex items-center justify-center border-4 border-white/20 z-30 shadow-[inset_0_0_30px_rgba(0,0,0,1)] relative">
            <button
              onClick={spin}
              disabled={isSpinning || isWaiting || staff.length === 0}
              className={`w-28 h-28 rounded-full font-black text-lg uppercase tracking-widest flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                isSpinning || isWaiting 
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed border-2 border-slate-800' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-90 border-4 border-blue-400/30'
              }`}
            >
              <i className={`fas ${isSpinning ? 'fa-sync fa-spin' : isWaiting ? 'fa-stopwatch' : 'fa-play'} mb-0.5 text-2xl`}></i>
              <span className="text-[10px]">{isSpinning ? 'SPINNING' : isWaiting ? 'WAIT' : 'เริ่มหมุน'}</span>
            </button>
          </div>

          {/* เส้นแบ่ง (แสดงเฉพาะเมื่อคนไม่เยอะเกินไป) */}
          {staff.length < 100 && (
            <div className="absolute inset-0">
               {staff.map((_, i) => (
                  <div 
                     key={i} 
                     className="absolute top-1/2 left-1/2 w-full h-[0.5px] bg-white/10 origin-left -translate-y-1/2"
                     style={{ transform: `rotate(${(i * 360) / staff.length}deg)` }}
                  />
               ))}
            </div>
          )}
        </div>
      </div>

      {/* สถานะลุ้น (ซ่อนเมื่อเต็มจอ) */}
      {!isFullscreen && (
        <div className="mt-10 text-center animate-in fade-in duration-1000">
           {isSpinning ? (
             <p className="text-blue-400 font-black uppercase tracking-[0.5em] animate-pulse">กำลังสุ่มผู้โชคดี...</p>
           ) : isWaiting ? (
             <p className="text-yellow-400 font-black uppercase tracking-[0.3em] animate-bounce">วงล้อหยุดแล้ว! กำลังประกาศผล...</p>
           ) : (
             <div className="bg-slate-900/40 px-6 py-3 rounded-2xl border border-slate-800">
               <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">บุคลากรทั้งหมด {staff.length} ท่าน</p>
             </div>
           )}
        </div>
      )}

      {/* Winner Card */}
      {showWinnerCard && winner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in zoom-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowWinnerCard(false)}></div>
           
           <div className="relative bg-white/5 backdrop-blur-3xl p-10 md:p-14 rounded-[3.5rem] border-2 border-white/20 shadow-[0_0_100px_rgba(37,99,235,0.3)] text-center max-w-4xl w-full flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-600 text-slate-950 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                 <i className="fas fa-trophy text-5xl"></i>
              </div>
              
              <p className="text-amber-400 font-black uppercase tracking-[0.6em] text-lg mb-4 italic">CONGRATULATIONS</p>
              
              <div className="space-y-6 mb-12">
                 <h3 className="text-5xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                   {winner.name}
                 </h3>
                 <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
                    <div className="px-8 py-3 bg-white/10 rounded-2xl text-xl font-black text-blue-300 border border-white/10 backdrop-blur-md">
                      ร.ร.{winner.school}
                    </div>
                    <div className="px-8 py-3 bg-white/10 rounded-2xl text-xl font-black text-emerald-300 border border-white/10 backdrop-blur-md">
                      กลุ่ม{winner.group}
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowWinnerCard(false)} 
                className="bg-white text-slate-950 px-16 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-blue-50 transition-all active:scale-95"
              >
                เสร็จสิ้น
              </button>
           </div>
        </div>
      )}

      <style>{`
        @keyframes load-progress { from { width: 0%; } to { width: 100%; } }
        .animate-load-progress { animation: load-progress 4s linear forwards; }
      `}</style>
    </div>
  );
};
