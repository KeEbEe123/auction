import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function TeamPage() {
  const [user] = useAuthState(auth);
  const [teamDetails, setTeamDetails] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [roleCounts, setRoleCounts] = useState({
    batsman: 0,
    wicketkeeper: 0,
    bowler: 0,
    allrounder: 0,
    uncapped: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!user) return;
      try {
        const teamsRef = collection(db, "teams");
        const q = query(
          teamsRef,
          where("members", "array-contains", user.displayName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const teamDoc = querySnapshot.docs[0];
          const teamData = teamDoc.data();
          setTeamDetails({
            id: teamDoc.id,
            name: teamData.name,
            players: teamData.players,
            budget: teamData.budget,
          });
          calculateRoleCounts(teamData.players);
        } else {
          console.warn("No team found for the current user.");
        }
      } catch (error) {
        console.error("Error fetching team details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [user]);

  const calculateRoleCounts = (players) => {
    const counts = {
      batsman: 0,
      wicketkeeper: 0,
      bowler: 0,
      allrounder: 0,
      uncapped: 0,
    };
    players.forEach((player) => {
      if (player.role === "Batsman" || player.role === "Wicketkeeper Batter")
        counts.batsman += 1;
      if (player.role === "Wicketkeeper Batter") counts.wicketkeeper += 1;
      if (player.role === "bowler") counts.bowler += 1;
      if (player.role === "Allrounder") counts.allrounder += 1;
      if (player.capped === 0) counts.uncapped += 1;
    });
    setRoleCounts(counts);
  };
  const calculateAverageRating = () => {
    const totalRating = selectedPlayers.reduce(
      (sum, player) => sum + player.rating,
      0
    );
    return selectedPlayers.length > 0
      ? (totalRating / selectedPlayers.length).toFixed(2)
      : 0;
  };

  const togglePlayerSelection = (player) => {
    if (selectedPlayers.some((p) => p.name === player.name)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.name !== player.name));
    } else if (selectedPlayers.length < 11) {
      setSelectedPlayers([...selectedPlayers, player]);
      calculateRoleCounts([...selectedPlayers, player]);
    } else {
      setError("You can only select a maximum of 11 players.");
    }
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length !== 11) {
      setError("You must select exactly 11 players.");
      return;
    }
    if (roleCounts.batsman !== 5) {
      setError("You must select 5 batsmen.");
      return;
    }
    if (roleCounts.bowler !== 4) {
      setError("You must select 4 bowlers.");
      return;
    }
    if (roleCounts.allrounder !== 2) {
      setError("You must select 2 allrounders.");
      return;
    }
    if (roleCounts.uncapped !== 2) {
      setError("You must select 2 uncapped players.");
      return;
    }

    try {
      const averageRating = calculateAverageRating();
      const teamRef = doc(db, "submissions", teamDetails.name); // Document ID is the team name

      // Create or update the submission document
      await setDoc(teamRef, {
        submittedPlayers: selectedPlayers,
        closingBudget: teamDetails.budget,
        averageRating,
      });

      alert("Team submitted successfully!");
    } catch (error) {
      console.error("Error submitting team:", error);
    }
  };

  if (loading)
    return (
      <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex justify-center items-center relative">
        <p className="font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-100 text-4xl">
          Loading your team details...
        </p>
      </div>
    );
  if (!teamDetails)
    return (
      <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex justify-center items-center relative">
        {" "}
        <p className="font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-100 text-4xl ">
          You are not currently part of any team.
        </p>
      </div>
    );

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex flex-col items-center relative">
      {/* Page Header */}
      <div className="absolute top-7 right-40 p-7">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Submit Team
        </button>
      </div>

      <h1 className="font-starbirl text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-violet-400 mb-8 p-4">
        Team: {teamDetails.name}
      </h1>

      {/* Team Info */}
      <div className="flex flex-col items-center mb-6">
        <p className="font-starbirl text-3xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-100 p-2">
          Budget Remaining: ₹{teamDetails.budget} crores
        </p>
        <p className="font-starbirl text-2xl text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-300">
          Selected Players: {selectedPlayers.length}/11
        </p>
      </div>

      {/* Roles Needed */}
      <div className="mb-6 w-full max-w-3xl bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4">
          Roles Needed:
        </h2>
        <ul className="text-lg font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200">
          <li>Batsmen: {roleCounts.batsman}/5</li>
          <li>Wicketkeeper: {roleCounts.wicketkeeper}/1</li>
          <li>Bowlers: {roleCounts.bowler}/4</li>
          <li>Allrounders: {roleCounts.allrounder}/2</li>
          <li>uncapped: {roleCounts.allrounder}/2</li>
        </ul>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {/* Players Grid */}
      <div className="grid grid-cols-3 gap-6 max-w-5xl">
        {teamDetails.players.map((player, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 shadow cursor-pointer ${
              selectedPlayers.some((p) => p.name === player.name)
                ? "bg-blue-400/30"
                : "bg-slate-800"
            } transition-all`}
            onClick={() => togglePlayerSelection(player)}
          >
            <img
              src={player.images || "https://via.placeholder.com/150"}
              alt={player.name}
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
            />
            <h3 className="text-xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
              {player.name}
            </h3>
            <p className="font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
              Role: {player.role}
            </p>
            <p className="font-starbirl text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
              Rating: {player.rating}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamPage;
