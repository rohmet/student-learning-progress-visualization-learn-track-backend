import { Router } from "express";
import {
  getMyDashboard,
  getEnrollmentDetails,
} from "./dashboard.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// Endpoint untuk dashboard utama
// GET /api/dashboard
router.get("/", requireAuth, getMyDashboard);

// Endpoint untuk detail satu course
// GET /api/dashboard/uuid-enrollment-abc
router.get("/:enrollmentId", requireAuth, getEnrollmentDetails);

export default router;
