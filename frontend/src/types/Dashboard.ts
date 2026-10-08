import type { Support_Request } from './Support_Request';
import type { Support_Session } from './Support_Session';

export type DashboardStatusTone =
  | 'planned' | 'to-confirm' | 'confirmed' | 'completed' | 'rated' | 'cancelled'
  | 'pending' | 'accepted' | 'scheduled' | 'rejected' | 'awaiting';

export interface DashboardStatus {
  label: string;
  tone: DashboardStatusTone;
}

export interface DashboardSessionItem {
  sessID: string;
  sessStatus: Support_Session['sessStatus'];
  studConfirmed: boolean;
  volConfirmed: boolean;
  category: Support_Request['category'];
  title: string;
  personName: string;
  rating: { value: number; count: number };
  sessDate: Date;
  dateLabel: string;
  status: DashboardStatus;
  description?: string;
  supportMode?: Support_Session['supportMode'];
  timeslot?: string;
  location?: string;
}

export interface DashboardRequestItem {
  reqID: string;
  reqStatus: Support_Request['reqStatus'];
  category: Support_Request['category'];
  title: string;
  personName: string;
  dateLabel: string;
  status: DashboardStatus;
  description: string;
}