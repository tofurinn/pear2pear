import type { Timestamp } from "firebase/firestore";

export type NotificationKind = "request" | "session" | "confirmed" | "rejected";

export interface Notification {
    notifID: string;
    UID: string;
    message: string;
    redirectionLink: string;
    notifTimestamp: Timestamp;
    isRead: boolean;
    kind?: NotificationKind;
    actorName?: string;
    category?: string;
    title?: string;
}