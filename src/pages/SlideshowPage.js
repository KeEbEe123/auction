import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import ScramblingText from "../components/ScramblingText";

function SlideshowPage() {
  const [currentAuction, setCurrentAuction] = useState(null);

  useEffect(() => {
    // Listen to the currentAuction document in Firestore
    const unsubscribe = onSnapshot(
      doc(db, "auction", "currentAuction"),
      (doc) => {
        if (doc.exists()) {
          setCurrentAuction(doc.data());
        }
      }
    );

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, []);

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex items-center justify-center">
      {currentAuction && currentAuction.isActive ? (
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-4xl w-full">
          {/* Current Bid */}
          <div className="text-center mb-6">
            {currentAuction.highestBidder ? (
              <>
                <span className="text-4xl font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-200 ">
                  Current Bid:{" "}
                </span>
                <span className="font-bold text-5xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                  {currentAuction.currentBid} cr
                </span>{" "}
                <span className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-300">
                  by {currentAuction.highestBidder}
                </span>
              </>
            ) : (
              <>
                <span className="text-4xl font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-200">
                  Starting Bid:{" "}
                </span>
                <span className="text-5xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                  {currentAuction.currentBid} crores
                </span>
              </>
            )}
          </div>

          {/* Player Image and Details */}
          <div className="flex flex-col items-center">
            <img
              src={
                currentAuction.player.images ||
                "https://via.placeholder.com/150"
              }
              alt={`${currentAuction.player.name}`}
              className="w-48 h-48 rounded-full object-cover mb-6"
            />
            <h1 className="font-starbirl text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4">
              <ScramblingText text={currentAuction.player.name} />
            </h1>
            <p className="font-starbirl text-3xl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-200 mb-2">
              {currentAuction.player.role}
            </p>
            <p className="font-starbirl text-3xl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-200 mb-6">
              Rating:{" "}
              <span className="font-amsterdam text-5xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-6">
                {" "}
                {currentAuction.player.rating}
              </span>
            </p>
            <p className="font-starbirl text-3xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-6 p-2">
              {currentAuction.player.capped ? "capped" : "uncapped"}
            </p>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {currentAuction.player.role === "Batsman" && (
              <>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-2">
                    Runs
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.runs}
                    </span>
                  </p>
                </div>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-2">
                    Strike Rate
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.strike_rate}
                    </span>
                  </p>
                </div>
              </>
            )}

            {currentAuction.player.role === "bowler" && (
              <>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-200 mb-2">
                    Wickets
                  </h2>
                  <p className="font-amsterdam text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-2">
                    {currentAuction.player.stats.wickets}
                  </p>
                </div>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-200 mb-2">
                    Economy
                  </h2>
                  <p className="font-amsterdam text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-2">
                    {currentAuction.player.stats.economy}
                  </p>
                </div>
              </>
            )}

            {currentAuction.player.role === "Allrounder" && (
              <>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200 mb-2">
                    Runs
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl  text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.runs}
                    </span>
                  </p>
                </div>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200 mb-2">
                    Wickets
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl  text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.wickets_taken}
                    </span>
                  </p>
                </div>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200 mb-2">
                    Strike Rate
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl  text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 ">
                      {currentAuction.player.stats.strike_rate}
                    </span>
                  </p>
                </div>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200 mb-2">
                    Economy
                  </h2>
                  <p className="font-bold text-white text-3xl ">
                    <span className="font-amsterdam text-4xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.economy}
                    </span>
                  </p>
                </div>
              </>
            )}

            {currentAuction.player.role === "Wicketkeeper Batter" && (
              <>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-2">
                    Runs
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.runs}
                    </span>
                  </p>
                </div>
                <div className="text-center bg-slate-900 p-4 rounded">
                  <h2 className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-2">
                    Strike Rate:
                  </h2>
                  <p className="font-bold text-white text-3xl">
                    <span className="font-amsterdam text-4xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                      {currentAuction.player.stats.strike_rate}
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <h1 className="font-starbirl text-6xl text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-300">
          No Active Auction
        </h1>
      )}
    </div>
  );
}

export default SlideshowPage;
