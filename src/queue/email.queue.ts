import { Queue } from "./connection";
import { connection } from "./connection";

export const EMAIL_QUEUE_NAME = "email-queue";
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });
