import type { Timestamp } from "firebase/firestore";

export interface Availability {
    availID: string;
    volUID: string;
    dayOfWeek: string;
    availTimeSlot: Timestamp;
    isAvailable: boolean;
}