import { Router } from "express";

import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  listUsers,
  listDrivers,
  listRides,
  approveDriver,
  suspendDriver,
  blockUser,
  unblockUser,
  generateReport,
  getAllDriverEarnings,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, authorize(["admin"]));

router.get("/users", listUsers);
router.get("/drivers", listDrivers);
router.get("/rides", listRides);

router.post("/drivers/:id/approve", approveDriver);
router.post("/drivers/:id/suspend", suspendDriver);

router.post("/users/:id/block", blockUser);
router.post("/users/:id/unblock", unblockUser);

router.get("/reports", generateReport);

router.get("/drivers/:id/earnings", getAllDriverEarnings);

export default router;
