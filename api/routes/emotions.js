const express = require("express");
const router = express.Router();
const Emotion = require("../models/Emotion");

// POST endpoint to save emotion data
router.post("/saveEmotion", async (req, res) => {
  try {
    const { meetingId, participantId, emotion, attention } = req.body;
    const newEmotion = new Emotion({
      meetingId,
      participantId,
      emotion,
      attention,
    });
    await newEmotion.save();
    res.status(200).json({ message: "Emotion data saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save emotion data" });
  }
});

module.exports = router;
