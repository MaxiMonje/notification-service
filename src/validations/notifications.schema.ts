// src/validations/notifications.schema.ts
import { z } from "zod";

const emailNotificationBase = z.object({
  app: z.string().min(2).max(100),        // "turnos", etc.
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  fromName: z.string().max(120).optional(),
  fromEmail: z.string().email().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.string().email().optional(),

  // ⬇️ clave string, valor unknown  (dos argumentos)
  metadata: z.record(z.string(), z.unknown()).optional()
});

type EmailNotificationInput = z.infer<typeof emailNotificationBase>;

export const emailNotificationSchema = emailNotificationBase.refine(
  (d: EmailNotificationInput) => Boolean(d.html || d.text),
  { message: "Provide html or text", path: ["html"] }
);

export type EmailNotificationDto = z.infer<typeof emailNotificationSchema>;


// ---------- WHATSAPP ----------
const e164Phone = z.string().regex(/^\+[1-9]\d{7,14}$/, "Use E.164, ej: +54911xxxxxxx");

// Mensaje de texto (sesión 24h)
export const whatsappTextSchema = z.object({
  app: z.string().min(2).max(100),
  to: e164Phone,
  text: z.string().min(1).max(4096),
  previewUrl: z.boolean().optional(),         // Meta Cloud permite preview_url en text
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Template (HSM) para envíos proactivos
export const whatsappTemplateSchema = z.object({
  app: z.string().min(2).max(100),
  to: e164Phone,
  template: z.object({
    name: z.string().min(1),
    language: z.object({ code: z.string().min(2) }),  // ej: "es_AR"
    components: z.array(z.object({
      type: z.enum(["header", "body", "button"]),
      parameters: z.array(z.union([
        z.object({ type: z.literal("text"), text: z.string().min(1) }),
        // se pueden extender a image/document/etc si querés
      ])).optional()
    })).optional()
  }),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const whatsappNotificationSchema = z.union([
  whatsappTextSchema,
  whatsappTemplateSchema
]);

export type WhatsAppNotificationDto = z.infer<typeof whatsappNotificationSchema>;