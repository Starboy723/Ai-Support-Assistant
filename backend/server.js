require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const chatRoutes = require("./routes/chat.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 20
}));

app.use("/api", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});