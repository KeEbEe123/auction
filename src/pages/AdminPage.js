import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import uploadPlayersToFirestore from "../uploadPlayerData";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  setDoc,
} from "firebase/firestore";

function AdminPage() {
  const [players, setPlayers] = useState([]);
  const [auctionedPlayers, setAuctionedPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [startingBid, setStartingBid] = useState(0);
  const [auctionActive, setAuctionActive] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const playerCollection = collection(db, "players");
      const playerSnapshot = await getDocs(playerCollection);
      const fetchedPlayers = playerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch players who have already been auctioned
      const auctionedPlayersDoc = await getDoc(
        doc(db, "auction", "playersOnAuction")
      );
      const auctionedPlayersList = auctionedPlayersDoc.exists()
        ? auctionedPlayersDoc.data().auctionedPlayers || []
        : [];

      setAuctionedPlayers(auctionedPlayersList);

      // Filter out auctioned players
      setPlayers(
        fetchedPlayers.filter(
          (player) =>
            !auctionedPlayersList.some(
              (auctioned) => auctioned.id === player.id
            )
        )
      );
    };

    fetchPlayers();
  }, []);

  const startAuction = async () => {
    if (selectedPlayer) {
      // Mark the selected player as on auction
      await updateDoc(doc(db, "auction", "currentAuction"), {
        player: selectedPlayer,
        isActive: true,
        currentBid: startingBid,
        highestBidder: null,
      });

      // Add the player to the list of auctioned players
      const auctionedRef = doc(db, "auction", "playersOnAuction");
      await setDoc(
        auctionedRef,
        {
          auctionedPlayers: arrayUnion(selectedPlayer),
        },
        { merge: true }
      );

      // Update UI
      setAuctionedPlayers((prev) => [...prev, selectedPlayer]);
      setPlayers((prev) =>
        prev.filter((player) => player.id !== selectedPlayer.id)
      );
      setAuctionActive(true);
      setStartingBid(0);
    }
  };

  const endAuction = async () => {
    const auctionRef = doc(db, "auction", "currentAuction");
    const auctionSnapshot = await getDoc(auctionRef);
    if (!auctionSnapshot.exists()) return;

    const currentAuction = auctionSnapshot.data();
    const { player, highestBidder, currentBid } = currentAuction;

    if (highestBidder && player) {
      const teamRef = doc(db, "teams", highestBidder);

      // Fetch the team's current budget
      const teamDoc = await getDoc(teamRef);
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const updatedBudget = teamData.budget - currentBid;

        // Update team's player list and budget
        await updateDoc(teamRef, {
          players: arrayUnion({
            ...player,
            teamName: highestBidder,
            price: currentBid,
          }),
          budget: updatedBudget,
        });
      }
    }

    // Reset auction data for a new auction
    await updateDoc(auctionRef, {
      isActive: false,
      player: null,
      currentBid: 0,
      highestBidder: null,
    });

    setAuctionActive(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen">
      {/* <button
        onClick={uploadPlayersToFirestore}
        className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
      >
        Upload Player Data
      </button> */}
      <h1 className="font-starbirl text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-8">
        Admin Dashboard
      </h1>

      {selectedPlayer && (
        <div className="mb-8">
          <h3 className="text-xl text-white mb-4">
            Selected Player: {selectedPlayer.name}
          </h3>
          <input
            type="number"
            value={startingBid}
            onChange={(e) => setStartingBid(Number(e.target.value))}
            placeholder="Set Starting Bid"
            className="border p-2 mr-2"
          />
          <button
            onClick={startAuction}
            disabled={auctionActive}
            className={`bg-green-500 text-white py-1 px-4 rounded ${
              auctionActive ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Start Auction
          </button>
        </div>
      )}

      {auctionActive && (
        <div className="mb-8">
          <button
            onClick={endAuction}
            className="bg-red-500 text-white py-1 px-4 rounded"
          >
            End Auction
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {["Batsman", "bowler", "Allrounder", "Wicketkeeper Batter"].map(
          (role) => (
            <div key={role} className="bg-slate-800 p-4 rounded">
              <h2 className="text-2xl font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4">
                {role}s
              </h2>
              {players
                .filter((player) => player.role === role)
                .map((player) => (
                  <div
                    key={player.id}
                    className={`p-2 border rounded mb-2 cursor-pointer ${
                      selectedPlayer?.id === player.id
                        ? "bg-red-300"
                        : "bg-blue-300"
                    }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <p className="text-lg font-bold">{player.name}</p>
                    <p>{player.capped ? "capped" : "uncapped"}</p>
                    <p>rating: {player.rating}</p>
                  </div>
                ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminPage;
