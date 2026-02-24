const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const docs = JSON.parse(fs.readFileSync("./docs.json"));

router.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    db.run(`INSERT OR IGNORE INTO sessions (id) VALUES (?)`, [sessionId]);

    db.run(
      `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
      [sessionId, "user", message],
    );

    const history = await new Promise((resolve, reject) => {
      db.all(
        `SELECT role, content FROM messages
         WHERE session_id = ?
         ORDER BY created_at DESC
         LIMIT 10`,
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.reverse());
        },
      );
    });

    
    const prompt = `
    You are a support assistant.
    You MUST answer ONLY using the documentation below.
    If the answer is not found in the documentation,
    reply EXACTLY:
    Sorry, I don’t have information about that.
    
    Documentation:
    ${docs.map((d) => `Title: ${d.title}\nContent: ${d.content}`).join("\n\n")}
    
    Conversation History:
    ${history.map((h) => `${h.role}: ${h.content}`).join("\n")}
    
    User Question:
    ${message}
    `;

  
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    let reply =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I don’t have information about that.";

   
    const isValid = docs.some((d) =>
      reply.toLowerCase().includes(d.content.toLowerCase()),
    );

    if (!isValid) {
      reply = "Sorry, I don’t have information about that.";
    }

    
    db.run(
      `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
      [sessionId, "assistant", reply],
    );

    res.json({
      reply,
      tokensUsed: 0,
    });
  } catch (error) {
    console.error("FULL ERROR:", error.response?.data || error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});


router.get("/conversations/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  db.all(
    `SELECT role, content, created_at
     FROM messages
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    [sessionId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB failure" });
      res.json(rows);
    },
  );
});


router.get("/sessions", (req, res) => {
  db.all(
    `SELECT id, updated_at
     FROM sessions
     ORDER BY updated_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB failure" });
      res.json(rows);
    },
  );
});

router.delete("/sessions", (req, res) => {
  db.serialize(() => {
    db.run(`DELETE FROM messages`);
    db.run(`DELETE FROM sessions`, function (err) {
      if (err) return res.status(500).json({ error: "DB failure" });

      res.json({ message: "All sessions deleted" });
    });
  });
});


module.exports = router;
