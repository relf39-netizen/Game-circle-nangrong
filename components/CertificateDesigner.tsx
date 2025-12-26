
import React, { useState, useRef } from 'react';
import { AwardTemplate, TextElementStyle, DEFAULT_ELEMENTS, FONT_OPTIONS, LogoConfig } from '../types.ts';
import { CertificateRenderer } from './CertificateRenderer.tsx';

interface CertificateDesignerProps {
  initialTemplate?: AwardTemplate;
  onSave: (template: AwardTemplate) => void;
  onCancel: () => void;
}

export const CertificateDesigner: React.FC<CertificateDesignerProps> = ({ initialTemplate, onSave, onCancel }) => {
  const [template, setTemplate] = useState<AwardTemplate>(initialTemplate || {
    id: Date.now().toString(),
    name: '',
    projectName: '',
    issueDate: new Date().toISOString().split('T')[0],
    backgroundImage: '',
    logoImage: '',
    logoConfig: { x: 500, y: 100, scale: 1, visible: false },
    elements: JSON.parse(JSON.stringify(DEFAULT_ELEMENTS)),
    defaultDescription: '',
    prefix: `MNR-${new Date().getFullYear()}`,
    startNumber: 1,
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string, quality = 0.7, maxDim = 2000): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height *= maxDim / width;
            width = maxDim;
          } else {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setTemplate(prev => ({ ...prev, backgroundImage: compressed }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // สำหรับโลโก้ เราใช้ PNG (ถ้าเป็นไปได้) เพื่อความโปร่งใส หรือ JPEG คุณภาพสูง
        const compressed = await compressImage(reader.result as string, 0.9, 800);
        setTemplate(prev => ({ 
          ...prev, 
          logoImage: compressed,
          logoConfig: { ...(prev.logoConfig || { x: 500, y: 100, scale: 1, visible: true }), visible: true }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedElementId(id);
    setIsDragging(true);
    setIsLogoDragging(false);
  };

  const handleLogoMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElementId('LOGO_ELEMENT');
    setIsLogoDragging(true);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = rect.width / 1000;
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);

    if (isDragging && selectedElementId && selectedElementId !== 'LOGO_ELEMENT') {
      setTemplate(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === selectedElementId ? { ...el, x, y } : el)
      }));
    } else if (isLogoDragging) {
      setTemplate(prev => ({
        ...prev,
        logoConfig: prev.logoConfig ? { ...prev.logoConfig, x, y } : { x, y, scale: 1, visible: true }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsLogoDragging(false);
  };

  const updateElementStyle = (id: string, updates: Partial<TextElementStyle>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));
  };

  const updateLogoConfig = (updates: Partial<LogoConfig>) => {
    setTemplate(prev => ({
      ...prev,
      logoConfig: prev.logoConfig ? { ...prev.logoConfig, ...updates } : { x: 500, y: 100, scale: 1, visible: true, ...updates }
    }));
  };

  const selectedElement = template.elements.find(el => el.id === selectedElementId);
  const visibleElements = template.elements.filter(el => el.visible);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-[2.5rem] overflow-hidden border shadow-sm" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="bg-white border-b px-8 py-6 flex justify-between items-center no-print">
        <div>
          <h2 className="text-xl font-black text-gray-900">ตัวออกแบบเกียรติบัตร (Pro)</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Custom Template & Branding</p>
        </div>
        <div className="space-x-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-all">ยกเลิก</button>
          <button 
            onClick={() => onSave(template)} 
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all disabled:opacity-30"
            disabled={!template.name || !template.backgroundImage || isCompressing}
          >
            {isCompressing ? 'กำลังบันทึก...' : 'บันทึกรูปแบบ'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-[600px]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto p-6 space-y-8 no-print custom-scrollbar">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">1. ข้อมูลพื้นฐาน</h3>
            <div className="space-y-3">
              <input type="text" value={template.name} onChange={e => setTemplate({...template, name: e.target.value})} className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="ชื่อกิจกรรม" />
              <input type="text" value={template.projectName} onChange={e => setTemplate({...template, projectName: e.target.value})} className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="ชื่อโครงการบนเกียรติบัตร" />
              <div className="pt-2">
                <label className="text-[9px] font-black text-blue-700 uppercase mb-1.5 block">เลขที่เริ่มต้น</label>
                <input type="number" min="1" value={template.startNumber || 1} onChange={e => setTemplate({...template, startNumber: parseInt(e.target.value) || 1})} className="w-full border-2 border-blue-50 bg-blue-50 rounded-xl p-2.5 text-sm font-bold outline-none" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">2. ตราโรงเรียน / โลโก้</h3>
            <div 
              className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 transition-all bg-gray-50 group"
              onClick={() => logoInputRef.current?.click()}
            >
              {template.logoImage ? (
                <div className="relative group">
                  <img src={template.logoImage} className="h-20 mx-auto object-contain rounded shadow-sm" alt="Logo" />
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-all">
                    <span className="text-[9px] font-black text-blue-700 bg-white px-2 py-1 rounded shadow">เปลี่ยนโลโก้</span>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <i className="fas fa-stamp text-2xl text-gray-300 mb-2"></i>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">อัปโหลดตราสัญลักษณ์</p>
                </div>
              )}
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
            {template.logoImage && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between">
                   <label className="text-[9px] font-black text-blue-900 uppercase">แสดงผล</label>
                   <input type="checkbox" checked={template.logoConfig?.visible || false} onChange={e => updateLogoConfig({ visible: e.target.checked })} />
                </div>
                <div>
                   <label className="text-[9px] font-black text-blue-900 uppercase block mb-1">ขนาด (Scale: {template.logoConfig?.scale || 1})</label>
                   <input type="range" min="0.2" max="3" step="0.1" value={template.logoConfig?.scale || 1} onChange={e => updateLogoConfig({ scale: parseFloat(e.target.value) })} className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <button 
                  onClick={() => setSelectedElementId('LOGO_ELEMENT')} 
                  className={`w-full py-2 rounded-lg text-[9px] font-black uppercase transition-all ${selectedElementId === 'LOGO_ELEMENT' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                >
                  <i className="fas fa-arrows-alt mr-2"></i> ปรับตำแหน่งโลโก้
                </button>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">3. รูปพื้นหลัง (A4)</h3>
            <div 
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${isCompressing ? 'border-blue-400 bg-blue-50 animate-pulse' : 'border-gray-200 hover:border-blue-400'}`}
              onClick={() => !isCompressing && fileInputRef.current?.click()}
            >
              {template.backgroundImage ? (
                  <img src={template.backgroundImage} className="h-20 w-full object-cover rounded shadow-md" alt="Preview" />
              ) : (
                  <div className="py-2">
                    <i className="fas fa-image text-2xl text-gray-300 mb-2"></i>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">อัปโหลดพื้นหลังเกียรติบัตร</p>
                  </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">4. องค์ประกอบข้อความ</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {template.elements.map(el => (
                <div key={el.id} className={`flex items-center p-2.5 rounded-xl transition-all ${selectedElementId === el.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={el.visible} onChange={e => updateElementStyle(el.id, { visible: e.target.checked })} className="mr-3 accent-blue-500" />
                  <span className={`flex-grow text-[10px] font-black cursor-pointer uppercase ${selectedElementId === el.id ? 'text-white' : 'text-gray-600'}`} onClick={() => el.visible && setSelectedElementId(el.id)}>
                    {el.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {selectedElement && selectedElementId !== 'LOGO_ELEMENT' && (
             <div className="border-t pt-6 space-y-5 animate-in slide-in-from-bottom-5 pb-8">
                 <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center">
                    <i className="fas fa-font mr-2 text-blue-500"></i> {selectedElement.label}
                 </h4>
                 <div className="space-y-4">
                     <div>
                         <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">ฟอนต์</label>
                         <select value={selectedElement.fontFamily} onChange={e => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })} className="w-full border-2 border-gray-100 bg-gray-50 p-2.5 rounded-xl text-xs font-bold focus:border-blue-500 outline-none transition-all">
                            {FONT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                         </select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">ขนาด</label>
                            <input type="number" value={selectedElement.fontSize} onChange={e => updateElementStyle(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })} className="w-full border-2 border-gray-100 p-2 rounded-xl text-xs" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">สี</label>
                            <input type="color" value={selectedElement.color} onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })} className="w-full h-8 border-none bg-transparent cursor-pointer" />
                        </div>
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">การจัดวาง</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {(['left', 'center', 'right'] as const).map(a => (
                                <button key={a} onClick={() => updateElementStyle(selectedElement.id, { align: a })} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${selectedElement.align === a ? 'bg-white shadow-sm text-blue-700' : 'text-gray-400'}`}>
                                    {a === 'left' ? 'ซ้าย' : a === 'center' ? 'กลาง' : 'ขวา'}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>
             </div>
          )}
        </div>

        {/* Designer Preview */}
        <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-12 relative" onMouseMove={handleMouseMove}>
            <div 
                ref={containerRef}
                className="relative shadow-2xl bg-white rounded-sm origin-center"
                style={{ width: '1000px', height: '707px', transform: 'scale(0.85)' }}
            >
                <CertificateRenderer template={template} showGrid={true} className="pointer-events-none" />
                <div className="absolute inset-0 z-20 overflow-hidden">
                    {/* Render Draggable Logo Placeholder */}
                    {template.logoImage && template.logoConfig?.visible && (
                        <div 
                           onMouseDown={handleLogoMouseDown}
                           style={{
                              position: 'absolute',
                              left: `${template.logoConfig.x}px`,
                              top: `${template.logoConfig.y}px`,
                              transform: 'translate(-50%, -50%)',
                              cursor: 'move',
                              zIndex: 50,
                              border: selectedElementId === 'LOGO_ELEMENT' ? '3px solid #3b82f6' : '1px dashed #3b82f6',
                              padding: '5px',
                              backgroundColor: selectedElementId === 'LOGO_ELEMENT' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                           }}
                        >
                           <img 
                             src={template.logoImage} 
                             style={{ 
                               height: `${120 * template.logoConfig.scale}px`,
                               width: 'auto',
                               display: 'block',
                               opacity: 0.8
                             }} 
                             alt="Logo Placeholder"
                           />
                           <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">ตราสัญลักษณ์</span>
                        </div>
                    )}

                    {/* Render Draggable Text Placeholders */}
                    {visibleElements.map(el => (
                        <div
                            key={el.id}
                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                            style={{
                                position: 'absolute',
                                left: `${el.x}px`,
                                top: `${el.y}px`,
                                transform: el.align === 'center' ? 'translateX(-50%)' : el.align === 'right' ? 'translateX(-100%)' : 'none',
                                cursor: 'move',
                                minWidth: '100px',
                                border: selectedElementId === el.id ? '2px solid #3b82f6' : '1px dashed #ccc',
                                textAlign: el.align,
                                padding: '4px',
                                backgroundColor: selectedElementId === el.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                zIndex: 40
                            }}
                        >
                            <div style={{ 
                                fontSize: `${el.fontSize}px`, 
                                opacity: 0.3, 
                                fontWeight: 'bold',
                                color: el.color,
                                fontFamily: `'${el.fontFamily}', sans-serif`,
                                WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${el.strokeColor || '#fff'}` : 'none'
                            }}>
                                [ {el.label} ]
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
