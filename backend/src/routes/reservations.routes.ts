import { Router } from "express";
import { reservationsController } from "../controllers/reservations.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", asyncHandler((req, res) => reservationsController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => reservationsController.get(req, res)));
router.post("/", asyncHandler((req, res) => reservationsController.create(req, res)));
router.patch("/:id", asyncHandler((req, res) => reservationsController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => reservationsController.cancel(req, res)));

export default router;
