
export interface LogbookEntry {
  id: string;
  batchId?: string;
  date: string;
  aircraftType: string;
  registration: string;
  routeFrom: string;
  routeTo: string;
  rotorcraft: number;
  solo: number;
  dualReceived: number;
  pic: number;
  sic: number;
  cfi: number;
  groundTrainer: number;
  day: number;
  night: number;
  crossCountry: number;
  actualInstrument: number;
  simulatedInstrument: number;
  instrApp: number;
  ldgDay: number;
  ldgNight: number;
  totalTime: number;
  remarks: string;
  signature: string;
  [key: string]: any; 
}

export interface ColumnDefinition {
  key: string;
  label: string;
  visible: boolean;
  isCustom: boolean;
  type: 'text' | 'number' | 'boolean' | 'time';
}

export interface SavedLog {
  id: string;
  name: string;
  timestamp: number;
  entries: LogbookEntry[];
  columns: ColumnDefinition[];
  year: string;
}

export interface ExtractionStats {
  confidence: number;
  entriesFound: number;
  processingTime: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR'
}
