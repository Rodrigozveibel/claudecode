import { Router } from "express";
import { webhookController } from "../controllers/webhook.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", (req, res) => webhookController.verify(req, res));
router.post("/", asyncHandler((req, res) => webhookController.receive(req, res)));

export default router;
