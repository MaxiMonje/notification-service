import { Request, Response, NextFunction } from "express";

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header("X-API-Key");
  if (!key || key !== process.env.API_KEY_NOTIF) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
