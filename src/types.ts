export interface MemberUnit {
  id: string;
  name: string;
  code: string;
  headOfUnit: string;
  email: string;
  phone: string;
  electricityThreshold: number; // kWh per month
  waterThreshold: number; // m3 per month
  electricityPrice: number; // VND per kWh
  waterPrice: number; // VND per m3
}

export interface Reading {
  id: string;
  unitId: string;
  month: number;
  year: number;
  elecPrev: number;
  elecCurrent: number;
  waterPrev: number;
  waterCurrent: number;
  elecConsumed: number;
  waterConsumed: number;
  elecCost: number;
  waterCost: number;
  isElecWarning: boolean;
  isWaterWarning: boolean;
  submittedAt: string;
}

export interface AlertLog {
  id: string;
  unitId: string;
  unitName: string;
  month: number;
  year: number;
  type: 'electricity' | 'water' | 'both';
  consumedValue: number;
  thresholdValue: number;
  percentageExceeded: number;
  methods: ('email' | 'sms' | 'system')[];
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  message: string;
}

export interface SystemConfig {
  defaultElectricityPrice: number;
  defaultWaterPrice: number;
  automaticAlertEnabled: boolean;
  notifyHeadOfUnit: boolean;
}
