import { Queue } from "./connection";
import { connection } from "./connection";

export const WHATSAPP_QUEUE_NAME = "whatsapp-queue";
export const whatsappQueue = new Queue(WHATSAPP_QUEUE_NAME, { connection });