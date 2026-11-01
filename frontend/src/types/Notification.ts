import type { Timestamp } from "firebase/firestore";

export type NotificationType = "request" | "session";
export type NotificationRecipientRole = "student" | "volunteer";

export interface Notification {
    notifID: string;
    UID: string;
    message: string;
    notifTimestamp: Timestamp;
    isRead: boolean;
    type: NotificationType;
    recipientRole?: NotificationRecipientRole;
    actorName?: string;
    category?: string;
    title?: string;
}