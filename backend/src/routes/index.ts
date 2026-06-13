import { Router } from "express";
import webhookRoutes from "./webhook.routes";
import conversationsRoutes from "./conversations.routes";
import reservationsRoutes from "./reservations.routes";
import roomsRoutes from "./rooms.routes";
import guestsRoutes from "./guests.routes";
import promotionsRoutes from "./promotions.routes";
import analyticsRoutes from "./analytics.routes";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Public webhook (no auth) — providers POST here.
router.use("/webhook", webhookRoutes);

// Dashboard APIs (auth in production).
router.use("/conversations", authMiddleware, conversationsRoutes);
router.use("/reservations", authMiddleware, reservationsRoutes);
router.use("/rooms", authMiddleware, roomsRoutes);
router.use("/guests", authMiddleware, guestsRoutes);
router.use("/promotions", authMiddleware, promotionsRoutes);
router.use("/analytics", authMiddleware, analyticsRoutes);

export default router;
