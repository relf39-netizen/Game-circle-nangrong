
export type GroupName = 'นครนางรอง' | 'เมืองนางรอง' | 'โบสถ์พระยาแสงทอง' | 'สะเดาไทรงาม' | 'หนองยายพิมพ์' | 'ลุ่มลำมาศ';

export const SCHOOL_GROUPS: GroupName[] = [
  'นครนางรอง',
  'เมืองนางรอง',
  'โบสถ์พระยาแสงทอง',
  'สะเดาไทรงาม',
  'หนองยายพิมพ์',
  'ลุ่มลำมาศ'
];

export interface Staff {
  id: string;
  name: string;
  school: string;
  group: GroupName;
  created_at: string;
  isWinner?: boolean;
}

export interface SystemSettings {
  regEnabled: boolean;
  editLocked: boolean; // เพิ่มสถานะล็อคการแก้ไขสำหรับบุคคลทั่วไป
  spinPassword: string;
  adminPassword: string;
  adminUser: string;
}

export const toThaiDigits = (num: string | number): string => {
  const str = num.toString();
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return str.replace(/[0-9]/g, (w) => thaiDigits[+w]);
};

// --- Added Missing Types for Certificate System ---

/**
 * Types of recipients for certificates
 */
export type RecipientType = 'นักเรียน' | 'ครู/บุคลากร' | 'ผู้บริหาร' | 'บุคคลทั่วไป';
export const TYPE_OPTIONS: RecipientType[] = ['นักเรียน', 'ครู/บุคลากร', 'ผู้บริหาร', 'บุคคลทั่วไป'];

/**
 * Recipient information for a specific certificate
 */
export interface Recipient {
  id: string;
  templateId: string;
  name: string;
  type: string;
  school: string;
  runningNumber: string;
  customDescription?: string;
  pdfUrl?: string;
}

/**
 * Style configuration for text elements in the certificate designer
 */
export interface TextElementStyle {
  id: string;
  label: string;
  text?: string;
  visible: boolean;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  is3D?: boolean;
  shadowBlur?: number;
  shadowColor?: string;
  strokeWidth?: number;
  strokeColor?: string;
}

/**
 * Configuration for the school logo or seal
 */
export interface LogoConfig {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

/**
 * Main certificate template definition
 */
export interface AwardTemplate {
  id: string;
  name: string;
  projectName: string;
  issueDate: string;
  backgroundImage: string;
  logoImage?: string;
  logoConfig?: LogoConfig;
  elements: TextElementStyle[];
  defaultDescription: string;
  prefix?: string;
  startNumber?: number;
}

/**
 * Predefined award texts for quick selection
 */
export interface AwardPreset {
  id: string;
  text: string;
}

/**
 * School information for selection lists
 */
export interface SchoolItem {
  id: string;
  name: string;
}

/**
 * Types of official documents
 */
export type DocumentType = 'หนังสือ' | 'คำสั่ง' | 'ประกาศ' | 'วาระการประชุม';
export const DOCUMENT_TYPE_OPTIONS: DocumentType[] = ['หนังสือ', 'คำสั่ง', 'ประกาศ', 'วาระการประชุม'];

/**
 * File attachment information for documents
 */
export interface AttachedFile {
  name: string;
  url: string;
}

/**
 * Official document metadata
 */
export interface DocumentItem {
  id: string;
  title: string;
  type: DocumentType;
  date: string;
  files: AttachedFile[];
  description?: string;
}

/**
 * Available fonts for certificates
 */
export const FONT_OPTIONS = [
  { id: 'Sarabun', name: 'สารบรรณ (Sarabun)' },
  { id: 'Krub', name: 'ครับ (Krub)' },
  { id: 'Chakra Petch', name: 'จักรเพชร (Chakra Petch)' },
  { id: 'Mali', name: 'มะลิ (Mali)' },
  { id: 'Srisakdi', name: 'ศรีศักดิ์ (Srisakdi)' },
  { id: 'Charm', name: 'ชาม (Charm)' },
];

/**
 * Default element layout for new certificate designs
 */
export const DEFAULT_ELEMENTS: TextElementStyle[] = [
  { id: 'code', label: 'เลขที่เกียรติบัตร', visible: true, x: 150, y: 50, fontSize: 18, color: '#000000', fontFamily: 'Sarabun', align: 'left' },
  { id: 'recipient', label: 'ชื่อ-นามสกุล ผู้รับ', visible: true, x: 500, y: 320, fontSize: 48, color: '#000000', fontFamily: 'Sarabun', align: 'center' },
  { id: 'role', label: 'ตำแหน่ง/ประเภท', visible: true, x: 500, y: 380, fontSize: 24, color: '#666666', fontFamily: 'Sarabun', align: 'center' },
  { id: 'school', label: 'โรงเรียน/หน่วยงาน', visible: true, x: 500, y: 420, fontSize: 24, color: '#000000', fontFamily: 'Sarabun', align: 'center' },
  { id: 'description', label: 'คำอธิบายรางวัล', visible: true, x: 500, y: 480, fontSize: 28, color: '#000000', fontFamily: 'Sarabun', align: 'center' },
  { id: 'project', label: 'ชื่อโครงการ/กิจกรรม', visible: true, x: 500, y: 540, fontSize: 20, color: '#444444', fontFamily: 'Sarabun', align: 'center' },
  { id: 'date', label: 'วันที่ออกเกียรติบัตร', visible: true, x: 500, y: 620, fontSize: 18, color: '#000000', fontFamily: 'Sarabun', align: 'center' },
];
