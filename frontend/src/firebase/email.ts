import emailjs from "@emailjs/browser";

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  expiryMinutes: number = 10
) {
  const expiryTime = new Date(Date.now() + expiryMinutes * 60_000).toLocaleTimeString();

  const result = await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      email: toEmail,
      OTP_code: otpCode,
      expiry_time: expiryTime,
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );

  if (result.status !== 200) {
    throw new Error(`EmailJS failed: ${result.text}`);
  }
  return result;
}