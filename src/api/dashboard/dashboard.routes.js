import { Router } from "express";
import {
  getMyDashboard,
  getEnrollmentDetails,
  getRecommendations,
} from "./dashboard.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// Endpoint untuk dashboard utama
// GET /api/dashboard
router.get("/", requireAuth, getMyDashboard);

// Endpoint untuk rekomendasi kursus
// GET /api/dashboard/recommendations
router.get("/recommendations", requireAuth, getRecommendations);

// Endpoint untuk detail satu course
// GET /api/dashboard/uuid-enrollment-abc
router.get("/:enrollmentId", requireAuth, getEnrollmentDetails);

export default router;
