import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/dashboard", asyncHandler((req, res) => analyticsController.dashboard(req, res)));
router.get("/performance", asyncHandler((req, res) => analyticsController.performance(req, res)));

export default router;
