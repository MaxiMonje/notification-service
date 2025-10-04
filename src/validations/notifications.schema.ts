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
