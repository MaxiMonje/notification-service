import { Router } from "express";
import { postEmailNotification } from "../controllers/notifications.controller";
import { requireApiKey } from "../middlewares/apiKey";
import { emailQueue } from "../queue/email.queue";

const router = Router();

router.post("/notifications/email", requireApiKey, postEmailNotification);

// nuevo: consultar estado de un job
router.get("/notifications/job/:id", requireApiKey, async (req, res) => {
  const id = req.params.id;
  const job = await emailQueue.getJob(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const state = await job.getState(); // 'completed' | 'failed' | 'delayed' | 'active' | 'waiting'...
  const attemptsMade = job.attemptsMade;
  const returnvalue = job.returnvalue; // lo que devolvió el worker (si completed)
  const failedReason = job.failedReason;

  res.json({ id, state, attemptsMade, returnvalue, failedReason });
});

export default router;
