import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes/notifications.routes";
import { startEmailWorker } from "./workers/email.worker";
import { Request, Response, NextFunction } from "express";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);


app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal error" });
});

const port = process.env.PORT || 4010;

// inicia el worker y luego escucha
startEmailWorker();
app.listen(port, () => console.log(`[notification-ms] listening on http://localhost:${port}`));
