import { Router } from "express";
import { promotionsController } from "../controllers/promotions.controller";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", asyncHandler((req, res) => promotionsController.list(req, res)));
router.post("/", asyncHandler((req, res) => promotionsController.create(req, res)));
router.post("/:id/send", asyncHandler((req, res) => promotionsController.send(req, res)));

export default router;
