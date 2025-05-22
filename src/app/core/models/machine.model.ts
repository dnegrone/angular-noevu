export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  performance: number;
  performanceLog: PerformanceLogEntry[];
  errors: string[];
  errorHistory: ErrorEntry[];
  producedParts: number;
  production: ProductionInfo;
  details: MachineDetails;
  maintenanceHistory: MaintenanceEntry[];
  liveSensors: LiveSensorData;
  currentShift: ShiftInfo;
}

export enum MachineStatus {
  Offline = 0,
  Running = 1,
  Error = 2,
  Maintenance = 3,
}

export interface PerformanceLogEntry {
  timestamp: string;
  performance: number;
}

export interface ErrorEntry {
  timestamp: string;
  errorCode: string;
  message: string;
  resolved: boolean;
}

export interface ProductionInfo {
  currentProduct: string;
  partsInBatch: number;
  partsCompleted: number;
  batchStartTime: string;
}

export interface MachineDetails {
  manufacturer: string;
  modelNumber: string;
  lastMaintenance: string;
  location: string;
}

export interface MaintenanceEntry {
  date: string;
  performedBy: string;
  notes: string;
}

export interface LiveSensorData {
  temperatureC: number;
  vibrationLevel: number;
  powerConsumptionKw: number;
}

export interface ShiftInfo {
  operatorName: string;
  shift: string;
}