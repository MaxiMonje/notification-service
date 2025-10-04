import { Request, Response, NextFunction } from "express";
import { emailNotificationSchema } from "../validations/notifications.schema";
import { emailQueue } from "../queue/email.queue";
import dayjs from "dayjs";

export async function postEmailNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = emailNotificationSchema.parse(req.body);

    const fromName  = parsed.fromName  || process.env.DEFAULT_FROM_NAME;
    const fromEmail = parsed.fromEmail || process.env.DEFAULT_FROM_EMAIL;

    // Datos del job
    const jobData = {
      to: parsed.to,
      subject: parsed.subject,
      html: parsed.html,
      text: parsed.text,
      fromName,
      fromEmail,
      cc: parsed.cc,
      bcc: parsed.bcc,
      replyTo: parsed.replyTo,
      metadata: { app: parsed.app, ...(parsed.metadata || {}) },
    };

    // Opcionales: schedule y reintentos
    const scheduleAt = (req.query.scheduleAt || req.body.scheduleAt) as string | undefined; // ISO 8601 o epoch ms
    const attempts = parseInt(process.env.QUEUE_ATTEMPTS || "5", 10);
    const backoff = parseInt(process.env.QUEUE_BACKOFF_MS || "15000", 10);

    // Delay si vino scheduleAt (momento futuro)
    const delay = scheduleAt
      ? Math.max(0, dayjs(scheduleAt).valueOf() - Date.now())
      : 0;

    const job = await emailQueue.add("send-email", jobData, {
      attempts,
      backoff: { type: "exponential", delay: backoff },
      removeOnComplete: 500,
      removeOnFail: 1000,
      ...(delay > 0 ? { delay } : {}),
    });

    return res.status(202).json({
      status: delay > 0 ? "scheduled" : "queued",
      jobId: job.id,
      queue: "email-queue",
      delayMs: delay
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ message: "Validation error", issues: err.issues });
    }
    next(err);
  }
}
