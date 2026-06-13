import { Router } from "express";
import { conversationsController } from "../controllers/conversations.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", asyncHandler((req, res) => conversationsController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => conversationsController.get(req, res)));
router.post(
  "/:id/messages",
  asyncHandler((req, res) => conversationsController.sendMessage(req, res)),
);
router.post(
  "/:id/takeover",
  asyncHandler((req, res) => conversationsController.takeover(req, res)),
);
router.post(
  "/:id/handback",
  asyncHandler((req, res) => conversationsController.handback(req, res)),
);

export default router;
