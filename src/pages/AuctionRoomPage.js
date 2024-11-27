import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ScramblingText from "../components/ScramblingText";

function AuctionRoomPage() {
  const [user] = useAuthState(auth);
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [teamJoined, setTeamJoined] = useState(false);
  const [budget, setBudget] = useState(100); // Default budget of 100cr
  const [error, setError] = useState("");
  const [lastAuctionPlayerId, setLastAuctionPlayerId] = useState("");
  const [capped, setCapped] = useState("");
  const navigate = useNavigate();

  // Check if user is already part of an existing team on page load
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (user) {
        const teamsRef = collection(db, "teams");
        const q = query(
          teamsRef,
          where("members", "array-contains", user.displayName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // If user is a member of a team, join that team
          const teamDoc = querySnapshot.docs[0];
          const teamData = teamDoc.data();
          setTeamName(teamData.name);
          setBudget(teamData.budget);
          setTeamJoined(true);
        }
      }
    };

    checkTeamMembership();
  }, [user]);

  // Listen for team budget changes in Firestore
  useEffect(() => {
    if (teamJoined && user) {
      const teamRef = doc(db, "teams", teamName);
      const unsubscribe = onSnapshot(teamRef, (doc) => {
        if (doc.exists()) {
          setBudget(doc.data().budget);
        }
      });
      return unsubscribe;
    }
  }, [teamJoined, teamName, user]);

  // Listen for auction updates
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "auction", "currentAuction"),
      (doc) => {
        setCurrentAuction(doc.data());
      }
    );
    return unsubscribe;
  }, []);

  // Function to join a new team
  const joinTeam = async () => {
    if (teamName && user) {
      const teamRef = doc(db, "teams", teamName);
      const teamDoc = await getDoc(teamRef);

      if (!teamDoc.exists()) {
        // Create new team document with initial budget and empty players array
        await setDoc(teamRef, {
          name: teamName,
          members: [user.displayName],
          budget: 100, // Set initial budget to 100cr
          players: [],
        });
        setTeamJoined(true);
        setBudget(100); // Initialize local budget
      } else {
        alert("Team name already exists! Please choose a different name.");
      }
    }
  };

  // Function to place a bid
  const placeBid = async () => {
    if (bidAmount > budget) {
      setError("Insufficient funds"); // Set error message if bid exceeds budget
      return;
    }
    if (bidAmount > currentAuction.currentBid) {
      await updateDoc(doc(db, "auction", "currentAuction"), {
        currentBid: bidAmount,
        highestBidder: teamName,
      });
      setBidAmount(0);
    }
  };

  // Function to handle player purchase after auction
  const handlePlayerPurchase = async () => {
    if (currentAuction && currentAuction.highestBidder === teamName) {
      const teamRef = doc(db, "teams", teamName);
      const teamDoc = await getDoc(teamRef);

      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const updatedBudget = teamData.budget - currentAuction.currentBid;

        // Update team with purchased player and new budget
        await updateDoc(teamRef, {
          budget: updatedBudget,
          players: [
            ...teamData.players,
            {
              name: currentAuction.player.player,
              price: currentAuction.currentBid,
            },
          ],
        });

        // End auction for current player
        await updateDoc(doc(db, "auction", "currentAuction"), {
          isActive: false,
          player: null,
          currentBid: 0,
          highestBidder: null,
        });
      }
    }
  };

  const [showAnimation, setShowAnimation] = useState(false);

  // useEffect(() => {
  //   // Trigger the animation when a high-rated player comes up
  //   if (currentAuction && currentAuction.player.rating > 95) {
  //     setShowAnimation(true);
  //     setTimeout(() => {
  //       setShowAnimation(false);
  //     }, 3000); // Animation duration in milliseconds
  //   }
  // }, [currentAuction]);

  useEffect(() => {
    // Check if a new player is on auction
    if (
      currentAuction?.isActive &&
      currentAuction?.player?.id !== lastAuctionPlayerId &&
      currentAuction?.player?.rating > 95
    ) {
      setShowAnimation(true);
      setLastAuctionPlayerId(currentAuction?.player?.id);

      // Automatically hide animation after a few seconds
      setTimeout(() => {
        setShowAnimation(false);
      }, 3000); // Adjust duration as needed
    }
  }, [currentAuction]);

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex justify-center items-center relative">
      <div className="absolute top-7 right-40 p-7">
        <Link
          to="/team"
          className="bg-blue-500 font-amsterdam text-2xl text-white py-2 px-4 rounded hover:bg-blue-600 absolute left-[80%] "
        >
          Team
        </Link>
      </div>
      {/* Overlay Animation */}
      {showAnimation && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fadeOut delay-1000">
          <h2 className="text-white font-starbirl font-bold text-[300px] animate-slideIn">
            {currentAuction?.player?.name}
          </h2>
        </div>
      )}

      <div className="flex justify-between w-full gap-4 max-w-7xl">
        {/* Left Bento Box */}
        <div className="flex-1 flex-col bg-opacity-25 rounded-lg p-8">
          {!teamJoined ? (
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="border p-2 mr-2 font-starbirl bg-slate-800 text-white"
              />
              <button
                onClick={joinTeam}
                className="bg-blue-500 text-2xl font-amsterdam text-white py-1 px-4 rounded"
              >
                Join Team
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-starbirl  text-transparent bg-clip-text bg-gradient-to-t from-slate-800 to-slate-400 leading-[6rem] text-[110px] font-bold rotate-[270deg] absolute top-[250px] left-[-250px]">
                Auction
                <br />
                Room
              </h1>
              <p className="font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-400 text-[200px] rotate-[270deg] absolute left-[-60px] top-[250px]  ">
                {teamName}
              </p>
            </>
          )}
        </div>

        {/* Center Bento Box */}
        <div className="flex-1 bg-opacity-25 rounded-lg p-8 text-center">
          {currentAuction && teamJoined && currentAuction.isActive ? (
            <>
              <img
                src={currentAuction.player.images}
                alt={`${currentAuction.player.name}`}
                className="w-48 h-48 mx-auto mb-4 rounded-full object-cover"
              />
              <h2 className="text-5xl  text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 font-amsterdam font-bold mb-2">
                <ScramblingText text={currentAuction.player.name} />
              </h2>
              <p className="text-3xl  text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 font-amsterdam font-bold mb-2">
                {currentAuction.player.role}
              </p>
              <p className="text-lg font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
                Rating:{" "}
                <span className="text-5xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                  {" "}
                  {currentAuction.player.rating}
                </span>
              </p>

              <div className="mt-4">
                <p className="font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
                  {currentAuction.highestBidder ? (
                    <>
                      Current Bid:{" "}
                      <span className="font-bold text-5xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                        {currentAuction.currentBid} crores
                      </span>{" "}
                      by{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-400">
                        {" "}
                        {currentAuction.highestBidder}
                      </span>
                    </>
                  ) : (
                    <>
                      Starting Bid:{" "}
                      <span className="text-5xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                        {currentAuction.currentBid} crores
                      </span>
                    </>
                  )}
                </p>

                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  placeholder="Enter your bid"
                  className="border p-2 mr-2 mt-4 w-full"
                />
                <button
                  onClick={placeBid}
                  className="bg-indigo-500 font-amsterdam text-black hover:bg-slate-500 text-4xl py-2 px-4 rounded w-full mt-2 transition-all"
                >
                  Bid
                </button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full">
              <p className="flex text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl text-4xl m-auto">
                Wait for player to go on auction
              </p>{" "}
              <LoadingSpinner />
            </div>
          )}
        </div>
        {/* Right Bento Box */}
        <div className="flex-1   bg-opacity-25 rounded-lg p-8">
          {currentAuction && teamJoined && currentAuction.isActive && (
            <div>
              <h3 className="text-5xl text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl font-bold mb-4 flex justify-center animation-slideFromRight delay-1000">
                Player Stats
              </h3>
              <ul className="text-left text-lg">
                <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                  Matches:{" "}
                  <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                    {" "}
                    <ScramblingText
                      text={currentAuction.player.stats.matches}
                    />
                  </span>
                </li>

                {currentAuction.player.role === "Wicketkeeper Batter" && (
                  <>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Runs:{" "}
                      <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
                        {" "}
                        <ScramblingText
                          text={currentAuction.player.stats.runs}
                        />
                      </span>
                    </li>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Strike Rate:{" "}
                      <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                        <ScramblingText
                          text={currentAuction.player.stats.strike_rate}
                        />
                      </span>
                    </li>
                  </>
                )}
                {currentAuction.player.role === "bowler" && (
                  <>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Wickets:
                      <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                        {" "}
                        <ScramblingText
                          text={currentAuction.player.stats.wickets}
                        />
                      </span>
                    </li>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Economy:
                      <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                        {" "}
                        <ScramblingText
                          text={currentAuction.player.stats.economy}
                        />
                      </span>
                    </li>
                  </>
                )}
                {currentAuction.player.role === "Batsman" && (
                  <>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Runs:{" "}
                      <ScramblingText text={currentAuction.player.stats.runs} />
                    </li>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Strike Rate:{" "}
                      <ScramblingText
                        text={currentAuction.player.stats.strike_rate}
                      />
                    </li>
                  </>
                )}
                {currentAuction.player.role === "Allrounder" && (
                  <>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Runs:{" "}
                      <ScramblingText text={currentAuction.player.stats.runs} />
                    </li>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Strike Rate:{" "}
                      <ScramblingText
                        text={currentAuction.player.stats.strike_rate}
                      />
                    </li>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Economy:{" "}
                      <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                        {" "}
                        <ScramblingText
                          text={currentAuction.player.stats.economy}
                        />
                      </span>
                    </li>
                    <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                      Wickets:
                      <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                        {" "}
                        <ScramblingText
                          text={currentAuction.player.stats.wickets_taken}
                        />
                      </span>
                    </li>
                  </>
                )}
                <li className="text-transparent bg-clip-text bg-gradient-to-t from-slate-600 to-slate-400 font-starbirl">
                  capped/uncapped:{""}
                  <span className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 text-4xl">
                    {currentAuction.player.capped ? "Capped" : "Uncapped"}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// CSS in Tailwind
// Add the following animations to your global CSS file or Tailwind config

// Slide-in animation for the player name

export default AuctionRoomPage;
