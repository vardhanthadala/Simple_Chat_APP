require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chat_app",
  charset: "utf8mb4",
};

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const pool = mysql.createPool(dbConfig);

app.get("/messages", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, text, created_at FROM messages ORDER BY created_at ASC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("sendMessage", async (payload) => {
    try {
      const { username = "Anonymous", text = "" } = payload;
      if (!text || !text.trim()) return;
      const [result] = await pool.query(
        "INSERT INTO messages (username, text) VALUES (?, ?)",
        [username, text]
      );
      const insertedId = result.insertId;
      const [rows] = await pool.query(
        "SELECT id, username, text, created_at FROM messages WHERE id = ?",
        [insertedId]
      );
      const message = rows[0];
      io.emit("newMessage", message);
    } catch (err) {
      console.error("sendMessage error", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
