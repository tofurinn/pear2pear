export const SKIP_OTP = import.meta.env.VITE_SKIP_OTP === "true";
console.log("SKIP_OTP =", SKIP_OTP, "raw =", import.meta.env.VITE_SKIP_OTP);