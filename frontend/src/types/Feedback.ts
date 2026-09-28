import type { Timestamp } from "firebase/firestore";

export interface Feedback {
    fbID: string;
    sessID: string;
    rating: number;
    comments: string;
    fbTimestamp: Timestamp;
}