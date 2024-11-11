const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const emotionRoutes = require("./routes/emotions");
const callRoutes = require("./routes/calls");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/meetingData", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/emotions", emotionRoutes);
app.use("/api/calls", callRoutes);

const PORT = 4545;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
