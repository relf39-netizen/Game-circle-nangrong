
export type RoleType = string;

export const ROLE_SUGGESTIONS = [
  'นักเรียน',
  'ครูผู้สอน',
  'ผู้บริหาร',
  'บุคลากร',
  'กรรมการตัดสิน',
  'วิทยากร',
  'ผู้เข้ารับการอบรม'
];

export const INITIAL_AWARD_PRESETS = [
  'รางวัลชนะเลิศ ลำดับที่ ๑',
  'รางวัลรองชนะเลิศอันดับ ๑',
  'รางวัลรองชนะเลิศอันดับ ๒',
  'รางวัลระดับเหรียญทอง ลำดับที่ ๑',
  'รางวัลระดับเหรียญเงิน',
  'รางวัลระดับเหรียญทองแดง',
  'ผ่านการอบรมอย่างสมบูรณ์'
];

export const toThaiDigits = (num: string | number): string => {
  const str = num.toString();
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return str.replace(/[0-9]/g, (w) => thaiDigits[+w]);
};

export interface AwardPreset {
  id: string;
  text: string;
}

export interface TextElementStyle {
  id: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  visible: boolean;
  text?: string;
  width?: number;
}

export interface AwardTemplate {
  id: string;
  name: string;
  projectName: string;
  issueDate: string;
  backgroundImage: string;
  elements: TextElementStyle[];
  defaultDescription: string;
  prefix: string;
  created_at?: string;
}

export interface Recipient {
  id: string;
  templateId: string;
  name: string;
  role: string;
  runningNumber: string;
  customDescription?: string;
}

export const DEFAULT_ELEMENTS: TextElementStyle[] = [
  { id: 'recipient', label: 'ชื่อ-นามสกุล', x: 500, y: 300, fontSize: 48, fontFamily: 'Sarabun', color: '#000000', align: 'center', visible: true, width: 800 },
  { id: 'role', label: 'ตำแหน่ง/สถานะ', x: 500, y: 360, fontSize: 24, fontFamily: 'Sarabun', color: '#1f2937', align: 'center', visible: false, width: 600 },
  { id: 'description', label: 'รายละเอียดรางวัล', x: 500, y: 410, fontSize: 28, fontFamily: 'Sarabun', color: '#000000', align: 'center', visible: true, width: 700 },
  { id: 'project', label: 'ชื่อโครงการ', x: 500, y: 480, fontSize: 28, fontFamily: 'Sarabun', color: '#1f2937', align: 'center', visible: true, width: 800 },
  { id: 'date', label: 'วันที่', x: 500, y: 550, fontSize: 18, fontFamily: 'Sarabun', color: '#1f2937', align: 'center', visible: true },
  { id: 'code', label: 'เลขที่เกียรติบัตร', x: 920, y: 40, fontSize: 16, fontFamily: 'Sarabun', color: '#000000', align: 'right', visible: true },
  { id: 'school', label: 'ชื่อโรงเรียน/หน่วยงาน', x: 500, y: 150, fontSize: 32, fontFamily: 'Sarabun', color: '#000000', align: 'center', visible: false, text: 'กลุ่มโรงเรียนเมืองนางรอง' },
  { id: 'signatory_1', label: 'ชื่อผู้ลงนาม 1', x: 250, y: 620, fontSize: 20, fontFamily: 'Sarabun', color: '#000000', align: 'center', visible: false, text: '(นายสมชาย ใจดี)' },
  { id: 'signatory_pos_1', label: 'ตำแหน่งผู้ลงนาม 1', x: 250, y: 650, fontSize: 16, fontFamily: 'Sarabun', color: '#1f2937', align: 'center', visible: false, text: 'ประธานกลุ่มโรงเรียน' },
  { id: 'custom_1', label: 'ข้อความอิสระ 1', x: 500, y: 200, fontSize: 24, fontFamily: 'Sarabun', color: '#000000', align: 'center', visible: false, text: 'ข้อความเพิ่มเติม' },
];
