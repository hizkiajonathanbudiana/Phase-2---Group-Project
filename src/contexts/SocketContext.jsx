import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext();
const SOCKET_SERVER_URL = "http://localhost:3000";

export function SocketProvider({ children }) {
  const { user } = useSelector((state) => state.app);

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [notification, setNotification] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);

  const [voteState, setVoteState] = useState({
    currentVotes: 0,
    totalPlayers: 0,
  });

  const [gameSettings, setGameSettings] = useState({
    language: "English",
    rarity: "uncommon",
    topic: "general knowledge",
  });

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_SERVER_URL);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnected(true);
        newSocket.emit("joinGame", {
          id: user.id,
          username: user.username,
          email: user.email,
          solved: user.solved,
          role: user.role || "player",
        });
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

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

      newSocket.on("updateVoteCount", ({ currentVotes, totalPlayers }) => {
        setVoteState({ currentVotes, totalPlayers });
      });

      newSocket.on("gameNotification", (message) => {
        setNotification(message);
      });

      newSocket.on("gameSettingsUpdated", (settings) => {
        setGameSettings(settings);
      });

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  const submitAnswer = useCallback(
    (answer) => {
      if (socket) {
        socket.emit("submitAnswer", { answer });
      }
    },
    [socket]
  ); // Dependency-nya adalah 'socket'

  const voteForNewQuestion = useCallback(() => {
    if (socket) {
      socket.emit("voteNewQuestion");
    }
  }, [socket]);

  const adminUpdateSettings = useCallback(
    (settings) => {
      if (socket) {
        socket.emit("adminUpdateSettings", settings);
      }
    },
    [socket]
  );

  // 3. Gunakan useMemo untuk mengoptimalkan nilai context
  const value = useMemo(
    () => ({
      isConnected,
      currentQuestion,
      notification,
      chatHistory,
      onlinePlayers,
      voteState,
      gameSettings,
      // Masukkan fungsi yang sudah di-memoize
      submitAnswer,
      voteForNewQuestion,
      adminUpdateSettings,
    }),
    //  fungsi ke dependency array dari useMemo
    [
      isConnected,
      currentQuestion,
      notification,
      chatHistory,
      onlinePlayers,
      voteState,
      gameSettings,
      submitAnswer,
      voteForNewQuestion,
      adminUpdateSettings,
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
