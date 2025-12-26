
import React, { useState, useRef } from 'react';
import { AwardTemplate, TextElementStyle, DEFAULT_ELEMENTS } from '../types.ts';
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
    elements: JSON.parse(JSON.stringify(DEFAULT_ELEMENTS)),
    defaultDescription: '',
    prefix: `MNR-${new Date().getFullYear()}`,
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTemplate(prev => ({ ...prev, backgroundImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedElementId(id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = rect.width / 1000;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === selectedElementId ? { ...el, x: Math.round(x), y: Math.round(y) } : el)
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const updateElementStyle = (id: string, updates: Partial<TextElementStyle>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));
  };

  const selectedElement = template.elements.find(el => el.id === selectedElementId);
  const visibleElements = template.elements.filter(el => el.visible);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-[2.5rem] overflow-hidden border shadow-sm" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="bg-white border-b px-8 py-6 flex justify-between items-center no-print">
        <div>
          <h2 className="text-xl font-black text-gray-900">ตัวออกแบบเกียรติบัตร</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Template Designer & Effects</p>
        </div>
        <div className="space-x-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-all">ยกเลิก</button>
          <button 
            onClick={() => onSave(template)} 
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all disabled:opacity-30"
            disabled={!template.name || !template.backgroundImage}
          >
            บันทึกรูปแบบ
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-[600px]">
        <div className="w-80 bg-white border-r overflow-y-auto p-6 space-y-8 no-print custom-scrollbar">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">1. ข้อมูลกิจกรรม</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={template.name} 
                onChange={e => setTemplate({...template, name: e.target.value})}
                className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                placeholder="ชื่อเรียกกิจกรรม"
              />
              <input 
                type="text" 
                value={template.projectName} 
                onChange={e => setTemplate({...template, projectName: e.target.value})}
                className="w-full border-2 border-gray-50 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                placeholder="ชื่อโครงการ (แสดงบนภาพ)"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">2. รูปพื้นหลัง (A4)</h3>
            <div 
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {template.backgroundImage ? (
                  <img src={template.backgroundImage} className="h-28 w-full object-cover rounded-lg shadow-md" alt="Preview" />
              ) : (
                  <div className="py-4">
                    <i className="fas fa-image text-3xl text-gray-300 mb-3"></i>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Upload Template</p>
                  </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">3. องค์ประกอบ</h3>
            <div className="grid grid-cols-1 gap-2">
              {template.elements.map(el => (
                <div key={el.id} className={`flex items-center p-2 rounded-lg transition-all ${selectedElementId === el.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={el.visible} 
                    onChange={e => updateElementStyle(el.id, { visible: e.target.checked })}
                    className="mr-3"
                  />
                  <span 
                    className={`flex-grow text-xs font-bold cursor-pointer ${selectedElementId === el.id ? 'text-blue-700' : 'text-gray-500'}`}
                    onClick={() => el.visible && setSelectedElementId(el.id)}
                  >
                    {el.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {selectedElement && (
             <div className="border-t pt-6 space-y-5 animate-in slide-in-from-bottom-5">
                 <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center">
                    <i className="fas fa-magic mr-2 text-blue-500"></i> ตกแต่ง: {selectedElement.label}
                 </h4>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">ขนาดอักษร</label>
                         <input type="number" value={selectedElement.fontSize} onChange={e => updateElementStyle(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })} className="w-full border-2 border-gray-50 p-2 rounded-xl text-xs outline-none focus:border-blue-500" />
                     </div>
                     <div>
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">สีข้อความ</label>
                         <input type="color" value={selectedElement.color} onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })} className="w-full h-8 border-none bg-transparent cursor-pointer" />
                     </div>
                 </div>

                 <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">เอฟเฟกต์พิเศษ</p>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-gray-500 uppercase">ขอบเส้น (Stroke)</label>
                            <input type="number" step="0.5" min="0" max="5" value={selectedElement.strokeWidth || 0} onChange={e => updateElementStyle(selectedElement.id, { strokeWidth: parseFloat(e.target.value) })} className="w-16 border p-1 rounded-md text-[10px]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-gray-500 uppercase">สีขอบ</label>
                            <input type="color" value={selectedElement.strokeColor || '#ffffff'} onChange={e => updateElementStyle(selectedElement.id, { strokeColor: e.target.value })} className="w-16 h-6 border-none cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-gray-500 uppercase">เงานูน (3D Effect)</label>
                            <input type="checkbox" checked={selectedElement.is3D || false} onChange={e => updateElementStyle(selectedElement.id, { is3D: e.target.checked })} />
                        </div>
                    </div>
                 </div>
             </div>
          )}
        </div>

        <div className="flex-1 bg-gray-200/50 overflow-auto flex items-center justify-center p-12 relative" onMouseMove={handleMouseMove}>
            <div 
                ref={containerRef}
                className="relative shadow-2xl bg-white rounded-sm"
                style={{ width: '1000px', height: '707px', transform: 'scale(0.85)' }}
            >
                <CertificateRenderer template={template} showGrid={true} className="pointer-events-none" />
                <div className="absolute inset-0 z-20">
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
                                border: selectedElementId === el.id ? '2px dashed #3b82f6' : '1px dashed transparent',
                                textAlign: el.align,
                                padding: '4px'
                            }}
                        >
                            <span className="text-[8px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full absolute -top-3 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {el.label}
                            </span>
                            <div style={{ 
                                fontSize: `${el.fontSize}px`, 
                                opacity: 0.2, 
                                fontWeight: 'bold',
                                color: el.color,
                                WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${el.strokeColor}` : 'none'
                            }}>
                                [TEXT]
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
