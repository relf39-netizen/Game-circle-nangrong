
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
    backgroundImage: `url(${template.backgroundImage || 'https://via.placeholder.com/1000x707?text=MNR+Certificate'})`,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
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
        return recipient?.role || '{ตำแหน่ง}';
      case 'description':
        return recipient?.customDescription || template.defaultDescription || '{รายละเอียดรางวัล}';
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
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }}>
        </div>
      )}

      {template.elements.filter(el => el.visible).map((el) => {
        const content = getElementContent(el);
        let transform = 'none';

        if (el.align === 'center') transform = 'translateX(-50%)';
        else if (el.align === 'right') transform = 'translateX(-100%)';

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          fontSize: `${el.fontSize}px`,
          color: el.color,
          fontFamily: "'Sarabun', sans-serif",
          textAlign: el.align,
          transform: transform,
          width: el.width ? `${el.width}px` : 'auto',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.3,
          zIndex: 10,
          pointerEvents: 'none',
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
