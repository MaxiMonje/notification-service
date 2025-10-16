import { Worker } from "../queue/connection";
import { connection } from "../queue/connection";
import { WHATSAPP_QUEUE_NAME } from "../queue/whatsapp.queue";
import { sendWhatsAppMessage, WhatsAppJobData } from "../services/whatsappClient";

export function startWhatsAppWorker() {
  const concurrency = parseInt(process.env.WHATSAPP_WORKER_CONCURRENCY || "5", 10);

  const worker = new Worker<WhatsAppJobData>(
    WHATSAPP_QUEUE_NAME,
    async (job) => {
      const result = await sendWhatsAppMessage(job.data);
      return { provider: process.env.WHATSAPP_PROVIDER || "meta", result };
    },
    { connection, concurrency }
  );

  worker.on("completed", (job, ret) => {
    console.log(`[whatsapp.worker] completed job ${job.id}`, ret);
  });

  worker.on("failed", (job, err) => {
    console.error(`[whatsapp.worker] failed job ${job?.id}`, err?.message);
  });

  return worker;
}