
import React from 'react';
import { AwardTemplate, Recipient, TextElementStyle, toThaiDigits } from '../types.ts';

interface CertificateRendererProps {
  template: AwardTemplate;
  recipient?: Recipient;
  scale?: number;
  className?: string;
  showGrid?: boolean;
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({ 
  template, 
  recipient, 
  scale = 1, 
  className = '',
  showGrid = false
}) => {
  const containerStyle: React.CSSProperties = {
    width: '1000px',
    height: '707px',
    position: 'relative',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    overflow: 'hidden',
    backgroundColor: 'white',
  };

  const getElementContent = (el: TextElementStyle): string => {
    if (el.text) return el.text; 
    
    switch (el.id) {
      case 'recipient':
        return recipient?.name || '{ชื่อ-นามสกุล}';
      case 'role':
        return recipient?.type || '{ประเภท/ตำแหน่ง}';
      case 'school':
        return recipient?.school || '{ชื่อโรงเรียน}';
      case 'description':
        return recipient?.customDescription || template.defaultDescription || '';
      case 'project':
        return template.projectName || '{ชื่อโครงการ}';
      case 'date':
        if (!template.issueDate) return '{วันที่}';
        return new Date(template.issueDate).toLocaleDateString('th-TH', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'code':
        return toThaiDigits(recipient?.runningNumber || '๑/๒๕๖๘');
      default:
        return el.label;
    }
  };

  return (
    <div className={`certificate-container ${className}`} style={containerStyle}>
      {/* 1. Background Image */}
      <img 
        src={template.backgroundImage || 'https://via.placeholder.com/1000x707?text=MNR+Certificate'} 
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none'
        }}
        alt="Background"
      />

      {/* 2. Grid for Designer */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-10 z-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }}>
        </div>
      )}

      {/* 3. Logo/Seal Image */}
      {template.logoImage && template.logoConfig?.visible && (
        <img 
          src={template.logoImage} 
          style={{
            position: 'absolute',
            left: `${template.logoConfig.x}px`,
            top: `${template.logoConfig.y}px`,
            transform: 'translate(-50%, -50%)',
            height: `${120 * (template.logoConfig.scale || 1)}px`,
            width: 'auto',
            objectFit: 'contain',
            zIndex: 15,
            pointerEvents: 'none'
          }}
          alt="School Seal"
        />
      )}

      {/* 4. Text Elements */}
      {template.elements.filter(el => el.visible).map((el) => {
        const content = getElementContent(el);
        
        // สร้างเงาหลายชั้น (3D + Shadow)
        const shadowLayers = [];
        if (el.is3D) {
          shadowLayers.push('1px 1px 0px #ccc', '2px 2px 0px #bbb', '3px 3px 0px #aaa', '4px 4px 2px rgba(0,0,0,0.2)');
        }
        if (el.shadowBlur) {
          shadowLayers.push(`0 0 ${el.shadowBlur}px ${el.shadowColor || 'rgba(0,0,0,0.5)'}`);
        }

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          fontSize: `${el.fontSize}px`,
          color: el.color,
          fontFamily: `'${el.fontFamily}', 'Sarabun', sans-serif`,
          textAlign: el.align,
          // ใช้ max-content เพื่อให้ div กว้างเท่าข้อความจริง และ translateX(-50%) จะจัดกึ่งกลางได้แม่นยำแม้ล้นขอบ
          width: 'max-content', 
          transform: el.align === 'center' ? 'translateX(-50%)' : el.align === 'right' ? 'translateX(-100%)' : 'none',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
          zIndex: 20,
          pointerEvents: 'none',
          fontWeight: 'bold',
          textShadow: shadowLayers.length > 0 ? shadowLayers.join(', ') : 'none',
          WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${el.strokeColor || '#fff'}` : 'none',
          // @ts-ignore - paint-order ช่วยให้ Stroke ไม่ทับ Fill
          paintOrder: 'stroke fill',
        };

        return (
          <div key={el.id} style={style}>
            {content}
          </div>
        );
      })}
    </div>
  );
};
