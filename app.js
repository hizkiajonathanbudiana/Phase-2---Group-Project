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

const newRoundDelay = 10000;

const isProd = process.env.NODE_ENV === "production";

const io = new Server(server, {
  cors: {
    origin: isProd
      ? "https://quizai.hizkiajonathanbudiana.my.id"
      : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cookieParser());
app.use(
  cors({
    origin: isProd
      ? "https://quizai.hizkiajonathanbudiana.my.id"
      : "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routers);

let players = {}; // { userId: { id, username, email, solved, role, sockets: new Set() } }
let socketIdToUserId = {}; // { socketId: userId }

let gameSettings = {
  language: "English",
  rarity: "uncommon",
  topic: "general knowledge",
};

let currentQuestion = { question: "", answer: "" };
let isQuestionActive = false;
let chatHistory = [];
let votesForNewQuestion = new Set();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": isProd
      ? "https://quizai.hizkiajonathanbudiana.my.id"
      : "http://localhost:5173",
    "X-Title": "QuizRush.AI",
  },
});

async function generateQuizQuestion() {
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

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("joinGame", async ({ id, username, email, solved, role }) => {
    if (players[id]) {
      players[id].sockets.add(socket.id);
    } else {
      players[id] = {
        id,
        username,
        email,
        solved,
        role: role || "player",
        sockets: new Set([socket.id]),
      };
      console.log(
        `✨ ${username} (${email}) with role '${players[id].role}' joined.`
      );
    }
    socketIdToUserId[socket.id] = id;
    socket.emit("gameSettingsUpdated", gameSettings);
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

  socket.on("adminUpdateSettings", (newSettings) => {
    const userId = socketIdToUserId[socket.id];
    const player = players[userId];

    if (!player || player.role !== "admin") {
      console.warn(
        `SECURITY: Non-admin user ${player?.username || "Unknown"} (${
          socket.id
        }) tried to change settings.`
      );
      return;
    }

    gameSettings = { ...gameSettings, ...newSettings };
    console.log(
      `🔧 ADMIN ACTION: Settings updated by ${player.username}`,
      gameSettings
    );

    io.emit("gameSettingsUpdated", gameSettings);
    io.emit(
      "gameNotification",
      `Admin changed settings! Topic: ${gameSettings.topic}, Difficulty: ${gameSettings.rarity}. Answer before were: ${currentQuestion.answer}`
    );

    console.log("🚀 Admin triggered a new round with new settings.");
    startNewRound();
  });

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
      setTimeout(startNewRound, newRoundDelay);
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
        `Question skipped based on votes! Answers were: ${currentQuestion.answer}. Starting new round...`
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
    error.message === "LOGININVALID" ||
    error.message === "INVALIDLOGIN"
  ) {
    code = 401;
    message = "Invalid email or password";
  } else if (error.message === "EMAILSENDINGFAILED") {
    code = 400;
    message = "Failed to send verification email. Please try again later.";
  } else if (error.message === "REGISTERFIRST") {
    code = 400;
    message = "Please register first";
  } else if (error.message === "USERNOTFOUND") {
    code = 404;
    message = "User not found";
  }
  res.status(code).send({ message });
});

// --- START SERVER ---
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

module.exports = app;
