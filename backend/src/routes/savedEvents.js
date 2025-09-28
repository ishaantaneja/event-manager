import express from "express";
import {
  saveEvent,
  getSavedEvents,
  updateSavedEvent,
  removeSavedEvent,
  checkIfSaved,
  getSavedCount
} from "../controllers/savedEventController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All saved event routes require authentication

router.post("/", saveEvent);
router.get("/", getSavedEvents);
router.put("/:savedEventId", updateSavedEvent);
router.delete("/:eventId", removeSavedEvent);
router.get("/check/:eventId", checkIfSaved);
router.get("/count", getSavedCount);

export default router;
