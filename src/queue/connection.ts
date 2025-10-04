import { Queue, Worker, JobsOptions } from "bullmq";

const host = process.env.REDIS_HOST || "127.0.0.1";
const port = +(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;

export const connection = { host, port, password } as const;

export type JobOpts = JobsOptions;
export { Queue, Worker };
