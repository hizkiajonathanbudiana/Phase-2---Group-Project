// =================================================================
// IMPORTS & INITIAL SETUP
// =================================================================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const http = require("http"); // Diperlukan untuk Socket.IO
const { Server } = require("socket.io"); // Import Server dari Socket.IO
const cors = require("cors");
const cookieParser = require("cookie-parser");
const OpenAI = require("openai");

// Import dari file-file Anda
const routers = require("./routers/routers.js"); // Asumsi router Anda ada di sini
const { User, Status } = require("./models"); // Import model Sequelize

const isProd = process.env.NODE_ENV === "production";

// =================================================================
// EXPRESS APP & HTTP SERVER INITIALIZATION
// =================================================================
const app = express();
const server = http.createServer(app); // Buat server HTTP dari aplikasi Express
const port = process.env.PORT || 3000;

// =================================================================
// SOCKET.IO SERVER INITIALIZATION
// =================================================================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Ganti dengan URL frontend Anda
    // origin: "https://weimood.hizkiajonathanbudiana.my.id", // Jika sudah di-deploy
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// =================================================================
// MIDDLEWARE EXPRESS (Kode Anda yang sudah ada)
// =================================================================
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Pastikan ini juga konsisten
    // origin: "https://weimood.hizkiajonathanbudiana.my.id",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================================================================
// API ROUTES (Kode Anda yang sudah ada)
// =================================================================
app.use(routers);

// =================================================================
// GAME LOGIC & STATE (Di memori server)
// =================================================================
let players = {}; // Menyimpan data player yang online { socketId: { id, email, username } }
let currentQuestion = {
  question: "",
  answer: "",
};
let isQuestionActive = false;
let chatHistory = []; // Menyimpan chat dari jawaban yang salah

// =================================================================
// HELPER FUNCTION - AI QUESTION GENERATOR (Diadaptasi dari aiController)
// =================================================================
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173", // Ganti sesuai kebutuhan
    "X-Title": "QuizRush.AI", // Ganti sesuai kebutuhan
  },
});

async function generateQuizQuestion() {
  console.log("Generating new question from AI...");
  try {
    const promptString = `
      [CONTEXT FOR AI]
      You are a quiz generator AI.
      Your task: Generate ONE simple general knowledge question.
      Respond ONLY with a JavaScript object like this: { "question": "Your question here", "answer": "onewordanswer" }
      Rules:
      - The "answer" MUST be a single word (no spaces) and in lowercase.
      - Do NOT explain anything.
      - Do NOT include markdown, extra text, or formatting.
      - Just return the raw JSON object. Nothing else.
    `;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528:free", // atau model lain yang Anda suka
      messages: [{ role: "user", content: promptString }],
      response_format: { type: "json_object" }, // Memaksa output menjadi JSON
    });

    const content = response.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    console.log("AI Generated:", parsedContent);
    return parsedContent;
  } catch (error) {
    console.error("Error generating question from AI:", error);
    // Fallback question jika AI gagal
    return {
      question: "Ibukota Indonesia adalah...",
      answer: "jakarta",
    };
  }
}

// =================================================================
// SOCKET.IO CONNECTION HANDLER (Inti dari Game Real-time)
// =================================================================
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // 1. Saat player bergabung ke dalam game setelah login
  socket.on("joinGame", async ({ id, username, email }) => {
    console.log(`✨ ${username} (${email}) joined the game.`);
    players[socket.id] = { id, username, email };

    // Kirim history chat ke player yang baru bergabung
    socket.emit("chatHistory", chatHistory);

    // Broadcast ke semua player bahwa ada pemain baru
    io.emit("updatePlayerList", Object.values(players));

    // Jika ini player pertama dan belum ada soal, generate soal baru
    if (Object.keys(players).length === 1 && !isQuestionActive) {
      startNewRound();
    } else if (isQuestionActive) {
      // Jika sudah ada soal aktif, kirim ke player yang baru join
      socket.emit("newQuestion", { question: currentQuestion.question });
    }
  });

  // 2. Saat player mengirim jawaban
  socket.on("submitAnswer", async ({ answer }) => {
    if (!isQuestionActive || !players[socket.id]) {
      return; // Abaikan jika soal tidak aktif atau player tidak terdaftar
    }

    const player = players[socket.id];
    console.log(`📝 ${player.username} answered: ${answer}`);

    // Bandingkan jawaban (case-insensitive)
    if (answer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
      // JAWABAN BENAR
      isQuestionActive = false; // Kunci soal agar tidak bisa dijawab lagi

      // Update skor di database
      try {
        await Status.increment("solved", {
          by: 1,
          where: { UserId: player.id },
        });
        console.log(`🏆 Score updated for ${player.username}`);
      } catch (dbError) {
        console.error("Failed to update score:", dbError);
      }

      // Broadcast ke semua player siapa pemenangnya dan apa jawabannya
      io.emit("questionAnswered", {
        winnerName: player.username,
        answer: currentQuestion.answer,
      });

      // Setelah 10 detik, mulai ronde baru
      console.log("Starting new round in 10 seconds...");
      setTimeout(startNewRound, 10000);
    } else {
      // JAWABAN SALAH
      const chatMessage = {
        username: player.username,
        message: answer, // Tampilkan jawaban salah sebagai chat
      };
      chatHistory.push(chatMessage);
      // Batasi history chat agar tidak terlalu besar di memori
      if (chatHistory.length > 50) {
        chatHistory.shift();
      }
      // Broadcast pesan chat ke semua player
      io.emit("newChatMessage", chatMessage);
    }
  });

  // 3. Saat player disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    if (players[socket.id]) {
      delete players[socket.id];
      // Broadcast update daftar pemain
      io.emit("updatePlayerList", Object.values(players));
    }
  });
});

async function startNewRound() {
  console.log("--- Starting New Round ---");
  currentQuestion = await generateQuizQuestion();
  isQuestionActive = true;
  // Broadcast soal baru ke semua client
  io.emit("newQuestion", { question: currentQuestion.question });
}

// =================================================================
// CUSTOM ERROR HANDLER (Kode Anda yang sudah ada)
// =================================================================
app.use((error, req, res, next) => {
  let code = 500;
  let message = "Internal Server Error";

  console.log("Error:", error);

  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError"
  ) {
    code = 400;
    message =
      error.errors && error.errors.length > 0
        ? error.errors[0].message
        : error.message;
  } else if (error.name === "JsonWebTokenError") {
    code = 401;
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    code = 401;
    message = "Token expired";
  } else if (error.message === "NOTFOUND") {
    code = 404;
    message = "Resource not found";
  } else if (error.message === "FORBIDDEN") {
    code = 403;
    message = "Access forbidden";
  } else if (error.message === "BADREQUEST") {
    code = 400;
    message = "Bad request";
  } else if (error.message === "UNAUTHORIZED") {
    code = 401;
    message = "Unauthorized";
  } else if (error.message === "USERNOTFOUND") {
    code = 404;
    message = "User not found";
  } else if (
    error.message === "LOGININVALID" ||
    error.message === "INVALIDLOGIN"
  ) {
    code = 401;
    message = "Invalid email or password";
  }
  res.status(code).send({ message });
});

// =================================================================
// START SERVER
// =================================================================
// Gunakan server.listen BUKAN app.listen
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

module.exports = app; // Export app tetap bisa untuk testing
