// routes/calls.js
const express = require("express");
const router = express.Router();
const Emotion = require("../models/Emotion");

// GET endpoint to fetch all data for a specific call
router.get("/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    const callData = await Emotion.find({ meetingId: callId });
    res.status(200).json(callData);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve call data" });
  }
});

module.exports = router;
