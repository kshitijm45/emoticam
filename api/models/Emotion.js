const mongoose = require("mongoose");

const EmotionSchema = new mongoose.Schema({
  meetingId: String,
  participantId: String,
  emotion: String,
  attention: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Emotion", EmotionSchema);
