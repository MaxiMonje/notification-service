type WhatsAppTextPayload = {
  to: string;               // E.164
  text?: string;
  previewUrl?: boolean;
  metadata?: Record<string, unknown>;
};

type WhatsAppTemplatePayload = {
  to: string;
  template: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: "header" | "body" | "button";
      parameters?: Array<{ type: "text"; text: string }>;
    }>;
  };
  metadata?: Record<string, unknown>;
};

export type WhatsAppJobData = WhatsAppTextPayload | WhatsAppTemplatePayload;

const PROVIDER = (process.env.WHATSAPP_PROVIDER || "meta").toLowerCase();

export async function sendWhatsAppMessage(data: WhatsAppJobData) {
  return PROVIDER === "twilio" ? sendViaTwilio(data) : sendViaMetaCloud(data);
}

async function sendViaMetaCloud(data: WhatsAppJobData) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const apiVersion = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const base = { messaging_product: "whatsapp", to: getTo(data) };

  const body =
    "template" in data
      ? { ...base, type: "template", template: data.template }
      : { ...base, type: "text", text: { body: (data as any).text, preview_url: !!(data as any).previewUrl } };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`[meta] ${res.status} ${res.statusText}: ${text}`);
  return JSON.parse(text);
}

async function sendViaTwilio(data: WhatsAppJobData) {
  if ("template" in data) throw new Error("Twilio: templates no implementados en este ejemplo.");
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!; // ej: "whatsapp:+14155238886"

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: `whatsapp:${(data as any).to}`,
    From: from,
    Body: (data as any).text!
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`[twilio] ${res.status} ${res.statusText}: ${JSON.stringify(json)}`);
  return json;
}

function getTo(d: WhatsAppJobData) { return (d as any).to; }