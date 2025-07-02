import { useState, useEffect } from "react";
import { io } from "socket.io-client";

// =================================================================
// KONFIGURASI
// =================================================================
// Pastikan URL ini sesuai dengan alamat backend Anda
const SOCKET_SERVER_URL = "http://localhost:3000";

// Buat instance socket di luar komponen agar tidak dibuat ulang setiap render
const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // Kita akan connect secara manual setelah user "login"
});

// =================================================================
// KOMPONEN UTAMA
// =================================================================
export default function App() {
  // State untuk status koneksi dan game
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [user, setUser] = useState(null); // Menyimpan data user setelah "login"

  // State untuk data dari server
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [notification, setNotification] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);

  // State untuk input user
  const [answer, setAnswer] = useState("");

  // Efek untuk menangani event dari Socket.IO
  useEffect(() => {
    function onConnect() {
      console.log("✅ Terhubung ke server socket!");
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("❌ Terputus dari server socket!");
      setIsConnected(false);
    }

    // Listener untuk menerima soal baru
    function onNewQuestion({ question }) {
      console.log("❓ Soal baru:", question);
      setCurrentQuestion(question);
      setNotification(""); // Hapus notifikasi ronde sebelumnya
    }

    // Listener saat soal terjawab
    function onQuestionAnswered({ winnerName, answer }) {
      console.log(`🎉 Soal terjawab oleh ${winnerName}! Jawaban: ${answer}`);
      setCurrentQuestion(""); // Kosongkan soal
      setNotification(
        `Jawaban benar oleh ${winnerName}! Jawabannya: ${answer}. Ronde baru dalam 10 detik...`
      );
    }

    // Listener untuk pesan chat baru (jawaban salah)
    function onNewChatMessage(message) {
      console.log("💬 Pesan baru:", message);
      setChatHistory((prevHistory) => [...prevHistory, message]);
    }

    // Listener untuk menerima seluruh history chat saat join
    function onChatHistory(history) {
      console.log("📜 Menerima history chat:", history);
      setChatHistory(history);
    }

    // Listener untuk update daftar pemain online
    function onUpdatePlayerList(players) {
      console.log("👥 Update daftar pemain:", players);
      setOnlinePlayers(players);
    }

    // Daftarkan semua event listener
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("newQuestion", onNewQuestion);
    socket.on("questionAnswered", onQuestionAnswered);
    socket.on("newChatMessage", onNewChatMessage);
    socket.on("chatHistory", onChatHistory);
    socket.on("updatePlayerList", onUpdatePlayerList);

    // Cleanup function: hapus semua listener saat komponen unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newQuestion", onNewQuestion);
      socket.off("questionAnswered", onQuestionAnswered);
      socket.off("newChatMessage", onNewChatMessage);
      socket.off("chatHistory", onChatHistory);
      socket.off("updatePlayerList", onUpdatePlayerList);
    };
  }, []);

  // Handler untuk "Login" & Join Game
  const handleJoinGame = () => {
    // Di aplikasi nyata, data ini didapat setelah login/register via API
    // Untuk testing, kita buat data dummy
    const dummyUser = {
      id: Math.floor(Math.random() * 1000), // Dummy user ID dari DB
      username: `Player${Math.floor(Math.random() * 100)}`,
      email: `player${Math.floor(Math.random() * 100)}@test.com`,
    };
    setUser(dummyUser);

    // Connect ke socket server
    socket.connect();

    // Kirim event 'joinGame' dengan data user
    // Event ini harus dikirim setelah koneksi berhasil terbentuk
    socket.on("connect", () => {
      socket.emit("joinGame", dummyUser);
      // Hapus listener connect ini agar tidak dipanggil berulang kali
      socket.off("connect");
    });
  };

  // Handler untuk submit jawaban
  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (answer.trim() && isConnected) {
      socket.emit("submitAnswer", { answer });
      setAnswer(""); // Kosongkan input field setelah submit
    }
  };

  // Tampilan UI
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">QuizRush.AI</h1>
          <button
            onClick={handleJoinGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xl font-semibold transition-colors"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-indigo-400">QuizRush.AI</h1>
            <p className="text-gray-400">
              Welcome,{" "}
              <span className="font-semibold text-white">{user.username}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              Status:
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? " Connected" : " Disconnected"}
              </span>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Utama (Game) */}
          <main className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
            {/* Area Notifikasi */}
            {notification && (
              <div className="bg-yellow-500/20 border border-yellow-400 text-yellow-300 px-4 py-3 rounded-lg mb-4 text-center">
                <p>{notification}</p>
              </div>
            )}

            {/* Area Soal */}
            <div className="mb-6 text-center bg-gray-900 p-6 rounded-lg min-h-[150px] flex items-center justify-center">
              {currentQuestion ? (
                <p className="text-2xl lg:text-3xl font-semibold leading-relaxed">
                  {currentQuestion}
                </p>
              ) : (
                <p className="text-xl text-gray-500">
                  Waiting for the next question...
                </p>
              )}
            </div>

            {/* Form Jawaban */}
            <form onSubmit={handleAnswerSubmit}>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here and press Enter..."
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!isConnected || !currentQuestion}
              />
            </form>
          </main>

          {/* Kolom Samping (Chat & Players) */}
          <aside className="space-y-6">
            {/* Daftar Pemain */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
                Online Players ({onlinePlayers.length})
              </h2>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {onlinePlayers.map((player, index) => (
                  <li key={index} className="text-gray-300">
                    {player.username}
                  </li>
                ))}
              </ul>
            </div>

            {/* Live Chat */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
                Live Chat (Wrong Answers)
              </h2>
              <div className="space-y-3 h-64 overflow-y-auto pr-2">
                {chatHistory.map((chat, index) => (
                  <div key={index}>
                    <span className="font-bold text-indigo-400">
                      {chat.username}:{" "}
                    </span>
                    <span className="text-gray-300">{chat.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
