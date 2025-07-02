import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext();
// Pastikan URL ini sesuai dengan alamat server backend Anda
const SOCKET_SERVER_URL = "http://localhost:3000";

export function SocketProvider({ children }) {
  const { user } = useSelector((state) => state.app);

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // State untuk Game
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [notification, setNotification] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);

  // State untuk melacak status voting
  const [voteState, setVoteState] = useState({
    currentVotes: 0,
    totalPlayers: 0,
  });

  // [FITUR ADMIN] State untuk menyimpan pengaturan game dari server
  const [gameSettings, setGameSettings] = useState({
    language: "English",
    rarity: "uncommon",
    topic: "general knowledge",
  });

  useEffect(() => {
    // Hanya jalankan jika ada user yang login
    if (user) {
      const newSocket = io(SOCKET_SERVER_URL);
      setSocket(newSocket);

      // --- EVENT HANDLERS UTAMA ---
      newSocket.on("connect", () => {
        setIsConnected(true);
        // Kirim data user ke server, termasuk 'role'
        newSocket.emit("joinGame", {
          id: user.id,
          username: user.username,
          email: user.email,
          solved: user.solved,
          role: user.role || "player", // Mengirim role user
        });
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      // --- EVENT HANDLERS GAMEPLAY ---
      newSocket.on("newQuestion", ({ question }) => {
        setCurrentQuestion(question);
        setNotification("");
      });

      newSocket.on("questionAnswered", ({ winnerName, answer }) => {
        setCurrentQuestion("");
        setNotification(
          `Benar oleh ${winnerName}! Jawaban: ${answer}. Ronde baru sebentar lagi...`
        );
      });

      newSocket.on("newChatMessage", (message) =>
        setChatHistory((prev) => [...prev, message])
      );

      newSocket.on("updatePlayerList", (players) => {
        setOnlinePlayers(players);
      });

      // --- EVENT HANDLERS VOTING ---
      newSocket.on("updateVoteCount", ({ currentVotes, totalPlayers }) => {
        setVoteState({ currentVotes, totalPlayers });
      });

      newSocket.on("gameNotification", (message) => {
        setNotification(message);
      });

      // [FITUR ADMIN] Listener untuk update pengaturan game dari server
      newSocket.on("gameSettingsUpdated", (settings) => {
        setGameSettings(settings);
      });

      // Cleanup function
      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- FUNGSI AKSI YANG DIKIRIM KE KOMPONEN LAIN ---
  const submitAnswer = (answer) => {
    if (socket) {
      socket.emit("submitAnswer", { answer });
    }
  };

  const voteForNewQuestion = () => {
    if (socket) {
      socket.emit("voteNewQuestion");
    }
  };

  // [FITUR ADMIN] Fungsi untuk admin mengirim update pengaturan
  const adminUpdateSettings = (settings) => {
    if (socket) {
      socket.emit("adminUpdateSettings", settings);
    }
  };

  const value = useMemo(
    () => ({
      isConnected,
      currentQuestion,
      notification,
      chatHistory,
      onlinePlayers,
      submitAnswer,
      voteState,
      voteForNewQuestion,
      gameSettings, // Menyediakan state pengaturan
      adminUpdateSettings, // Menyediakan fungsi untuk admin
    }),
    [
      isConnected,
      currentQuestion,
      notification,
      chatHistory,
      onlinePlayers,
      voteState,
      gameSettings, // Tambahkan sebagai dependency
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

// Custom hook untuk mempermudah penggunaan context
export const useSocket = () => useContext(SocketContext);
