export async function sendAccountEmail(
  to: string,
  subject: string,
  url: string,
) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM) {
    throw new Error("Account email delivery is not configured.");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM,
      to: [to],
      subject,
      text: `${subject}\n\n${url}\n\nIf you did not request this, ignore this email.`,
    }),
  });
  if (!response.ok)
    throw new Error(
      "Account email could not be delivered. Please try again later.",
    );
}
