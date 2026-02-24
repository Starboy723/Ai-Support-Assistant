require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const chatRoutes = require("./routes/chat.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 20
}));

app.use("/api", chatRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));