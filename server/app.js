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
const { User, Status } = require("./models");

const isProd = process.env.NODE_ENV === "production";


const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(routers);

let players = {};
let currentQuestion = {
  question: "",
  answer: "",
};
let isQuestionActive = false;
let chatHistory = [];

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "QuizRush.AI",
  },
});

async function generateQuizQuestion() {
  console.log("Generating new question from AI...");
  try {
    const promptString = `
  [CONTEXT FOR AI]
You are a quiz generator AI.
Your task: Generate ONE uncommon knowledge question.

Rules:
- The question must be short and factual, using proper grammar and spacing.
- The answer must be a single word (no spaces) in lowercase.
- Question must avoid common trivia (like capital cities or famous landmarks).
- Choose topics that are less known or rarely discussed (e.g., ancient tech, obscure biology, lesser-known history).
- Do NOT repeat questions.
- Return ONLY a JavaScript object like this: { "question": "Your question here", "answer": "onewordanswer" }
- Do NOT include markdown, explanations, or extra text.
- Avoid made-up or nonsense questions.
    `;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [{ role: "user", content: promptString }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    console.log("AI Generated:", parsedContent);
    return parsedContent;
  } catch (error) {
    console.error("Error generating question from AI:", error);

    return {
      question: "Ibukota Indonesia adalah...",
      answer: "jakarta",
    };
  }
}


io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("joinGame", async ({ id, username, email }) => {
    console.log(`✨ ${username} (${email}) joined the game.`);
    players[socket.id] = { id, username, email };

    socket.emit("chatHistory", chatHistory);

    io.emit("updatePlayerList", Object.values(players));

    if (Object.keys(players).length === 1 && !isQuestionActive) {
      startNewRound();
    } else if (isQuestionActive) {

      socket.emit("newQuestion", { question: currentQuestion.question });
    }
  });


  socket.on("submitAnswer", async ({ answer }) => {
    if (!isQuestionActive || !players[socket.id]) {
      return;
    }

    const player = players[socket.id];
    console.log(`📝 ${player.username} answered: ${answer}`);


    if (answer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
      isQuestionActive = false;

      try {
        await Status.increment("solved", {
          by: 1,
          where: { UserId: player.id },
        });
        console.log(`🏆 Score updated for ${player.username}`);
      } catch (dbError) {
        console.error("Failed to update score:", dbError);
      }

      io.emit("questionAnswered", {
        winnerName: player.username,
        answer: currentQuestion.answer,
      });

      console.log("Starting new round in 10 seconds...");
      setTimeout(startNewRound, 10000);
    } else {

      const chatMessage = {
        username: player.username,
        message: answer,
      };
      chatHistory.push(chatMessage);

      if (chatHistory.length > 50) {
        chatHistory.shift();
      }

      io.emit("newChatMessage", chatMessage);
    }
  });


  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    if (players[socket.id]) {
      delete players[socket.id];

      io.emit("updatePlayerList", Object.values(players));
    }
  });
});

async function startNewRound() {
  console.log("--- Starting New Round ---");
  currentQuestion = await generateQuizQuestion();
  isQuestionActive = true;

  io.emit("newQuestion", { question: currentQuestion.question });
}

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

server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

module.exports = app;
