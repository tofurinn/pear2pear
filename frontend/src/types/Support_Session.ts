import type { Timestamp } from "firebase/firestore";

export interface Support_Session {
    sessID: string;
    reqID: string;
    sessDate: Date;
    sessTimeSlot: Timestamp;
    supportMode: "Physical" | "Online";
    meetingLocation: string;
    sessStatus: "Planned" | "Confirmed" | "Completed" | "Rated" | "Cancelled";
    sessTimestamp:  Timestamp;
    studConfirmed: boolean;
    volConfirmed: boolean;
}