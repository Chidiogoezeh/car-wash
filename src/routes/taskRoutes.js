import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getMyTasks,
  assignAttendant,
  updateTaskStatus,
} from "../controllers/taskController.js";

const router = express.Router();

router.get("/my-tasks", protect, authorize("attendant"), getMyTasks);
router.patch("/assign", protect, authorize("admin"), assignAttendant);
router.patch("/status/:id", protect, authorize("attendant"), updateTaskStatus);

export default router;
