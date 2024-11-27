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
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [finalPrice, setFinalPrice] = useState("");

  useEffect(() => {
    const fetchPlayers = async () => {
      const playerCollection = collection(db, "players");
      const playerSnapshot = await getDocs(playerCollection);
      const fetchedPlayers = playerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const auctionedPlayersDoc = await getDoc(
        doc(db, "auction", "playersOnAuction")
      );
      const auctionedPlayersList = auctionedPlayersDoc.exists()
        ? auctionedPlayersDoc.data().auctionedPlayers || []
        : [];

      setAuctionedPlayers(auctionedPlayersList);

      setPlayers(
        fetchedPlayers.filter(
          (player) =>
            !auctionedPlayersList.some(
              (auctioned) => auctioned.id === player.id
            )
        )
      );
    };

    const fetchTeams = async () => {
      const teamsCollection = collection(db, "teams");
      const teamsSnapshot = await getDocs(teamsCollection);
      const fetchedTeams = teamsSnapshot.docs.map((doc) => doc.id);
      setTeams(fetchedTeams);
    };

    fetchPlayers();
    fetchTeams();
  }, []);

  const startAuction = async () => {
    if (selectedPlayer) {
      const bid = selectedPlayer.capped ? 1 : 0.3;
      console.log(bid);
      setStartingBid(bid);
      console.log(startingBid);
      await updateDoc(doc(db, "auction", "currentAuction"), {
        player: selectedPlayer,
        isActive: true,
        currentBid: bid,
        highestBidder: null,
      });

      const auctionedRef = doc(db, "auction", "playersOnAuction");
      await setDoc(
        auctionedRef,
        {
          auctionedPlayers: arrayUnion(selectedPlayer),
        },
        { merge: true }
      );

      setAuctionedPlayers((prev) => [...prev, selectedPlayer]);
      setPlayers((prev) =>
        prev.filter((player) => player.id !== selectedPlayer.id)
      );
      setAuctionActive(true);
      setStartingBid(0);
    }
  };

  const endAuction = async () => {
    if (!selectedTeam || !finalPrice || isNaN(finalPrice)) {
      alert("Please select a team and enter a valid price.");
      return;
    }

    const teamRef = doc(db, "teams", selectedTeam);
    const teamDoc = await getDoc(teamRef);

    if (teamDoc.exists()) {
      const teamData = teamDoc.data();
      const updatedBudget = teamData.budget - finalPrice;

      if (updatedBudget < 0) {
        alert("Insufficient budget for the selected team.");
        return;
      }

      await updateDoc(teamRef, {
        players: arrayUnion({
          ...selectedPlayer,
          price: Number(finalPrice),
        }),
        budget: updatedBudget,
      });

      const auctionRef = doc(db, "auction", "currentAuction");
      await updateDoc(auctionRef, {
        isActive: false,
        player: null,
        currentBid: 0,
        highestBidder: null,
      });

      setAuctionActive(false);
      setSelectedPlayer(null);
      setSelectedTeam("");
      setFinalPrice("");
    } else {
      alert("Selected team does not exist.");
    }
  };

  const markUnsold = async () => {
    if (!selectedPlayer) {
      alert("No player selected for marking as unsold.");
      return;
    }

    const unsoldTeamRef = doc(db, "teams", "unsold");
    const unsoldTeamDoc = await getDoc(unsoldTeamRef);

    // Check if the "unsold" team document exists
    if (!unsoldTeamDoc.exists()) {
      await setDoc(unsoldTeamRef, {
        budget: 0, // No budget for unsold
        players: [],
      });
    }

    // Add the player to the "unsold" team's players array
    await updateDoc(unsoldTeamRef, {
      players: arrayUnion({
        ...selectedPlayer,
        price: 0, // Price is 0 for unsold players
      }),
    });

    // Remove the player from the current auction
    const auctionRef = doc(db, "auction", "currentAuction");
    await updateDoc(auctionRef, {
      isActive: false,
      player: null,
      currentBid: 0,
      highestBidder: null,
    });

    setAuctionedPlayers((prev) => [...prev, selectedPlayer]);
    setPlayers((prev) =>
      prev.filter((player) => player.id !== selectedPlayer.id)
    );
    setAuctionActive(false);
    setSelectedPlayer(null);

    alert(`${selectedPlayer.name} has been marked as unsold.`);
  };

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen">
      {/* <button
        onClick={uploadPlayersToFirestore}
        className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
      >
        Upload Player Data
      </button> */}
      <h1 className="font-amsterdam text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-8">
        Admin Dashboard
      </h1>

      {selectedPlayer && (
        <div className="mb-8">
          <h3 className="text-xl text-white mb-4">
            Selected Player: {selectedPlayer.name}
          </h3>
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
          <h3 className="text-white mb-4">End Auction</h3>
          <label className="text-white mr-4">
            Select Team:
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="text-black ml-2 p-2 border rounded"
            >
              <option value="">--Select Team--</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
          <label className="text-white ml-4">
            Enter Price:
            <input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="Final Price"
              className="text-black ml-2 p-2 border rounded"
            />
          </label>
          <button
            onClick={endAuction}
            className="bg-red-500 text-white py-1 px-4 rounded ml-4"
          >
            End Auction
          </button>
          <button
            onClick={markUnsold}
            className="bg-yellow-500 text-black py-1 px-4 rounded ml-4"
          >
            Unsold
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {["Batsman", "bowler", "Allrounder", "Wicketkeeper Batter"].map(
          (role) => (
            <div key={role} className="bg-slate-800 p-4 rounded">
              <h2 className="text-2xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4">
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
