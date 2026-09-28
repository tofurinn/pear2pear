import type { Timestamp } from "firebase/firestore";

export interface Notification {
    notifID: string
    UID: string;
    message: string;
    redirectionLink: string;
    notifTimestamp: Timestamp;
}