export interface Device {
  name: string;
  type: string;
  ip: string;
  mac: string;
}

export interface PingResult {
  status: 'online' | 'offline' | 'timeout' | 'error';
  success: boolean;
}

export interface Code {
  CodeId: number;
  CodeType: string;
  CodeName: string;
  Code: string;
}

export interface CodeInput {
  CodeType: string;
  CodeName: string;
  Code: string;
}

export interface OperationResult {
  success: number;
  message: string;
}

export interface RfState {
  _continu_to_sweep: string;
  _rf_sweep_message: string;
  _rf_sweep_status: string;
}

export interface CommandResult {
  data: string;
  success: number;
  message: string;
  type?: string;
  error?: string;
  bytes?: number;
  min_bytes?: number;
  token?: string;
}
