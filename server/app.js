if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const OpenAI = require("openai");

const routers = require("./routers/routers.js");
const { Status } = require("./models");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// --- KONSTANTA UNTUK GAME LOGIC ---
const NEW_ROUND_DELAY_MS = 10000;
const CHAT_HISTORY_LIMIT = 50;

// --- SOCKET.IO SERVER INITIALIZATION ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- MIDDLEWARE EXPRESS ---
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---
app.use(routers);

// --- GAME LOGIC & STATE (Di memori server) ---
let players = {}; // { userId: { id, username, email, solved, role, sockets: new Set() } }
let socketIdToUserId = {}; // { socketId: userId }

// [FITUR ADMIN] State untuk menyimpan pengaturan AI
let gameSettings = {
  language: "English",
  rarity: "uncommon",
  topic: "general knowledge",
};

let currentQuestion = { question: "", answer: "" };
let isQuestionActive = false;
let chatHistory = [];
let votesForNewQuestion = new Set();

// --- HELPER FUNCTION - AI QUESTION GENERATOR ---
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "QuizRush.AI",
  },
});

// [FITUR ADMIN] Fungsi ini sekarang dinamis berdasarkan gameSettings
async function generateQuizQuestion() {
  // Ambil pengaturan terbaru dari state server
  const { language, rarity, topic } = gameSettings;
  console.log(
    `Generating new question with settings: ${topic} | ${rarity} | ${language}`
  );

  try {
    const promptString = `
[CONTEXT FOR AI]
You are a quiz generator AI.
Your task: Generate ONE quiz question based on the following settings.

Settings:
- Language: ${language}
- Difficulty: ${rarity}
- Topic: ${topic}

Rules:
- The question must be short and factual.
- The answer must be a **single word**, lowercase, and contain no spaces.
- Use proper grammar and punctuation based on the specified language.
- Match the given difficulty by adjusting the obscurity of the topic.
- Avoid overly generic or well-known trivia unless the difficulty is "common".

Return ONLY a JavaScript object like this:
{ "question": "Your question here", "answer": "onewordanswer" }

Do NOT include markdown, explanations, or any other extra text.
    `;
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [{ role: "user", content: promptString }],
      response_format: { type: "json_object" },
    });
    const parsedContent = JSON.parse(response.choices[0].message.content);
    console.log("AI Generated:", parsedContent);
    return parsedContent;
  } catch (error) {
    console.error("Error generating question from AI:", error);
    return { question: "Ibukota Indonesia adalah...", answer: "jakarta" };
  }
}

// --- FUNGSI HELPER UNTUK GAME FLOW ---
function resetVotes() {
  votesForNewQuestion.clear();
  io.emit("updateVoteCount", {
    currentVotes: 0,
    totalPlayers: Object.keys(players).length,
  });
  console.log("🗳️ Votes have been reset.");
}

async function startNewRound() {
  console.log("--- Starting New Round ---");
  resetVotes();
  isQuestionActive = false;
  currentQuestion = await generateQuizQuestion();
  isQuestionActive = true;
  io.emit("newQuestion", { question: currentQuestion.question });
}

// --- SOCKET.IO CONNECTION HANDLER ---
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // 1. Saat player bergabung (sekarang juga membawa 'role')
  socket.on("joinGame", async ({ id, username, email, solved, role }) => {
    if (players[id]) {
      players[id].sockets.add(socket.id);
    } else {
      players[id] = {
        id,
        username,
        email,
        solved,
        role: role || "player", // Simpan role, default ke 'player' jika tidak ada
        sockets: new Set([socket.id]),
      };
      console.log(
        `✨ ${username} (${email}) with role '${players[id].role}' joined.`
      );
    }
    socketIdToUserId[socket.id] = id;

    // Kirim state game awal ke client yang baru join
    socket.emit("gameSettingsUpdated", gameSettings); // Kirim setting saat ini

    io.emit("updatePlayerList", Object.values(players));
    io.emit("updateVoteCount", {
      currentVotes: votesForNewQuestion.size,
      totalPlayers: Object.keys(players).length,
    });

    if (isQuestionActive) {
      socket.emit("newQuestion", { question: currentQuestion.question });
    }
    if (Object.keys(players).length === 1 && !isQuestionActive) {
      startNewRound();
    }
  });

  // [FITUR ADMIN] Event untuk admin mengubah pengaturan
  socket.on("adminUpdateSettings", (newSettings) => {
    const userId = socketIdToUserId[socket.id];
    const player = players[userId];

    // Keamanan: Pastikan hanya admin yang bisa menjalankan perintah ini
    if (!player || player.role !== "admin") {
      console.warn(
        `SECURITY: Non-admin user ${player?.username || "Unknown"} (${
          socket.id
        }) tried to change settings.`
      );
      return; // Hentikan eksekusi jika bukan admin
    }

    // Update state settings di server
    gameSettings = { ...gameSettings, ...newSettings };
    console.log(
      `🔧 ADMIN ACTION: Settings updated by ${player.username}`,
      gameSettings
    );

    // Broadcast pengaturan baru ke SEMUA client agar UI mereka bisa update
    io.emit("gameSettingsUpdated", gameSettings);
    io.emit(
      "gameNotification",
      `Admin changed settings! Topic: ${gameSettings.topic}, Difficulty: ${gameSettings.rarity}`
    );
  });

  // ... (event submitAnswer, voteNewQuestion, dan disconnect tetap sama)

  socket.on("submitAnswer", async ({ answer }) => {
    const userId = socketIdToUserId[socket.id];
    if (!isQuestionActive || !userId || !players[userId]) return;
    const player = players[userId];
    if (answer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
      isQuestionActive = false;
      try {
        await Status.increment("solved", {
          by: 1,
          where: { UserId: player.id },
        });
        players[userId].solved += 1;
      } catch (dbError) {
        console.error("Failed to update score:", dbError);
      }
      io.emit("questionAnswered", {
        winnerName: player.username,
        answer: currentQuestion.answer,
      });
      io.emit("updatePlayerList", Object.values(players));
      setTimeout(startNewRound, NEW_ROUND_DELAY_MS);
    } else {
      const chatMessage = { username: player.username, message: answer };
      io.emit("newChatMessage", chatMessage);
    }
  });

  socket.on("voteNewQuestion", () => {
    const userId = socketIdToUserId[socket.id];
    if (
      !isQuestionActive ||
      !userId ||
      !players[userId] ||
      votesForNewQuestion.has(userId)
    )
      return;
    votesForNewQuestion.add(userId);
    const totalPlayers = Object.keys(players).length;
    const currentVotes = votesForNewQuestion.size;
    const requiredVotes = Math.ceil(totalPlayers / 2);
    io.emit("updateVoteCount", { currentVotes, totalPlayers });
    if (currentVotes >= requiredVotes) {
      io.emit(
        "gameNotification",
        "Pertanyaan dilewati berdasarkan voting! Ronde baru dimulai..."
      );
      startNewRound();
    }
  });

  socket.on("disconnect", () => {
    const userId = socketIdToUserId[socket.id];
    if (!userId || !players[userId]) return;
    const player = players[userId];
    player.sockets.delete(socket.id);
    delete socketIdToUserId[socket.id];
    if (player.sockets.size === 0) {
      if (votesForNewQuestion.has(userId)) votesForNewQuestion.delete(userId);
      delete players[userId];
    }
    io.emit("updatePlayerList", Object.values(players));
    io.emit("updateVoteCount", {
      currentVotes: votesForNewQuestion.size,
      totalPlayers: Object.keys(players).length,
    });
    if (Object.keys(players).length === 0) {
      chatHistory = [];
      isQuestionActive = false;
      currentQuestion = { question: "", answer: "" };
      resetVotes();
    }
  });
});

// --- CUSTOM ERROR HANDLER ---
app.use((error, req, res, next) => {
  let code = 500;
  let message = "Internal Server Error";
  console.log(error);

  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError"
  ) {
    code = 400;
    message = error.errors[0].message;
  } else if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    code = 401;
    message = "Invalid or expired token";
  } else if (error.message === "NOTFOUND") {
    code = 404;
    message = "Resource not found";
  } else if (error.message === "FORBIDDEN") {
    code = 403;
    message = "Access forbidden";
  } else if (error.message === "BADREQUEST") {
    code = 400;
    message = "Bad request";
  } else if (
    error.message === "UNAUTHORIZED" ||
    error.message === "LOGININVALID"
  ) {
    code = 401;
    message = "Invalid credentials";
  }
  res.status(code).send({ message });
});

// --- START SERVER ---
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

module.exports = app;
