import axios from "axios";

const BASE = process.env.MAIL_SERVICE_BASE_URL || "http://localhost:3010/api/mail/send";
const API_KEY = process.env.MAIL_SERVICE_API_KEY;

export interface MailSendInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

export async function sendMailViaMailService(input: MailSendInput) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const resp = await axios.post(BASE, input, { headers, timeout: 15000 });
  return resp.data; // adapta si tu mail-ms devuelve otro shape
}
