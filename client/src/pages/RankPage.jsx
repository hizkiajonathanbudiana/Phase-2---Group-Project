import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchRankings } from "../features/rankSlice";

export default function RankPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: rankings, isLoading } = useSelector((state) => state.rankings);

  const { user } = useSelector((state) => state.app);
  useEffect(() => {
    if (!user.isVerified) {
      return navigate("/verify", { replace: true });
    } else {
      dispatch(fetchRankings());
    }
  }, [dispatch]);

  const handleGoHome = () => {
    navigate("/home");
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-8 font-orbitron text-white">
      <div className="w-full max-w-4xl bg-[#1c1c2b] rounded-3xl shadow-[0_0_30px_rgba(128,0,255,0.4)] p-8 border border-purple-800 relative overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-3xl blur-[40px] opacity-20 z-0"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-center drop-shadow-xl text-white tracking-widest mb-4">
            🏆 Leaderboard
          </h1>
          <div className="flex justify-center mb-6">
            <button
              onClick={handleGoHome}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-[0_4px_20px_rgba(0,255,255,0.3)] hover:brightness-125 transition duration-300"
            >
              Game
            </button>
          </div>

          {isLoading ? (
            <p className="text-center text-xl text-gray-300">
              Loading rankings...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-cyan-300 uppercase bg-[#2a2a40]">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-l-lg">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 rounded-r-lg">
                      Solved
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankings && rankings.length > 0 ? (
                    rankings.map((item, index) => (
                      <tr
                        key={item?.id}
                        className="bg-[#1c1c2b] border-b border-gray-700 hover:bg-[#2a2a40]"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 font-bold text-fuchsia-400">
                          {item.User ? item.User?.username : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-xl font-black">
                          {item?.solved}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-8 text-gray-400"
                      >
                        No ranking data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
