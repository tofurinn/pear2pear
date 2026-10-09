import type { Timestamp } from "firebase/firestore";

export interface OTP_Code {
    codeID: string;
    UID: string;
    verificationCode: string;
    expiresAt: Timestamp;
    isUsed: boolean;
}