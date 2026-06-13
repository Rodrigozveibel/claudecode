import { Router } from "express";
import { guestsController } from "../controllers/guests.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", asyncHandler((req, res) => guestsController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => guestsController.get(req, res)));
router.post("/", asyncHandler((req, res) => guestsController.create(req, res)));
router.patch("/:id", asyncHandler((req, res) => guestsController.update(req, res)));

export default router;
