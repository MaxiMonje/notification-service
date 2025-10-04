import { Worker } from "../queue/connection";
import { connection } from "../queue/connection";
import { EMAIL_QUEUE_NAME } from "../queue/email.queue";
import { sendMailViaMailService } from "../services/mailClient";

type EmailJobData = {
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
};

export function startEmailWorker() {
  const concurrency = 5;

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const d = job.data;
      const result = await sendMailViaMailService({
        to: d.to,
        subject: d.subject,
        html: d.html,
        text: d.text,
        fromName: d.fromName,
        fromEmail: d.fromEmail,
        cc: d.cc,
        bcc: d.bcc,
        replyTo: d.replyTo,
        metadata: d.metadata,
      });
      return { provider: "mail-service", result };
    },
    { connection, concurrency }
  );

  worker.on("completed", (job, ret) => {
    console.log(`[email.worker] completed job ${job.id}`, ret);
  });

  worker.on("failed", (job, err) => {
    console.error(`[email.worker] failed job ${job?.id}`, err?.message);
  });

  return worker;
}
