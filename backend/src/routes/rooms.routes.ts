import { Router } from "express";
import { roomsController } from "../controllers/rooms.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", asyncHandler((req, res) => roomsController.list(req, res)));
router.get("/availability", asyncHandler((req, res) => roomsController.availability(req, res)));
router.get("/:id", asyncHandler((req, res) => roomsController.get(req, res)));
router.patch("/:id", asyncHandler((req, res) => roomsController.update(req, res)));

export default router;
