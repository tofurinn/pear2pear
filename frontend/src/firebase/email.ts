import emailjs from "@emailjs/browser";

/*
 * Sends OTP email via emailJS
 * The service ID, Template ID and Public Key are in the Firebase variables yml file
 */
export async function sendOtpEmail(
  toEmail: string,                // Recipient email address
  otpCode: string,                // The 6-digit code to include in the email body
  expiryMinutes: number = 10      // How long the code is valid for
) {
  // Human-readable expiry time for the email body
  // Purely cosmetic, the actual timeout is enforced by date comparison in otp.ts
  const expiryTime = new Date(Date.now() + expiryMinutes * 60_000).toLocaleTimeString();

  const result = await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    // Keys must match {{variable}} placeholders in the emailJS template
    {
      email: toEmail,
      OTP_code: otpCode,
      expiry_time: expiryTime,
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );

  // EmailJS returns status 200 on success
  // Any other value means the send failed silently
  // Throw so the try/catch can show can error to the user
  if (result.status !== 200) {
    throw new Error(`EmailJS failed: ${result.text}`);
  }
  return result;
}