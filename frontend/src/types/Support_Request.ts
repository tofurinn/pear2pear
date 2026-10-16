import type { Timestamp } from "firebase/firestore";

export interface Support_Request {
    reqID: string;
    studUID: string;
    volUID: string;
    title: string;
    description: string;
    category: "Academic Support" | "Technology Support" | "New Student Support" | "General Student Support";
    reqStatus: "Pending" | "Accepted" | "Rejected" | "Cancelled" | "Scheduled";
    reqTimestamp: Timestamp;
    supportMode?: "Physical" | "Virtual";
}