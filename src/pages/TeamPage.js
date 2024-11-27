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
import ScramblingTextRename from "../components/ScramblingTextRename";

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
  const [roleCountArray, setRoleCountArray] = useState([]);

  useEffect(() => {
    let intervalId;

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

    intervalId = setInterval(() => {
      fetchTeamDetails();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!teamDetails?.players) return;

    // Calculate the role counts
    const counts = teamDetails.players.reduce(
      (acc, player) => {
        if (
          player.role === "Batsman" ||
          player.role === "Wicketkeeper Batter"
        ) {
          acc.batsman++;
        }
        if (player.role === "Wicketkeeper Batter") {
          acc.wicketkeeper++;
        }
        if (player.role === "bowler") {
          acc.bowler++;
        }
        if (player.role === "Allrounder") {
          acc.allrounder++;
        }
        if (player.capped === 0) {
          acc.uncapped++;
        }
        return acc;
      },
      {
        batsman: 0,
        wicketkeeper: 0,
        bowler: 0,
        allrounder: 0,
        uncapped: 0,
      }
    );

    // Convert counts to an array of objects for use later
    const countsArray = Object.entries(counts).map(([role, count]) => ({
      role,
      count,
    }));

    setRoleCountArray(countsArray);
  }, [teamDetails?.players]);
  const calculateRoleCounts = (players) => {
    const counts = {
      batsman: 0,
      wicketkeeper: 0,
      bowler: 0,
      allrounder: 0,
      uncapped: 0,
    };
    players.forEach((player) => {
      if (player.role === "Batsman" || player.role === "Wicketkeeper Batter") {
        counts.batsman += 1;
      }
      if (player.role === "Wicketkeeper Batter") counts.wicketkeeper += 1;
      if (player.role === "bowler") counts.bowler += 1;
      if (player.role === "Allrounder") counts.allrounder += 1;
      if (player.capped === 0) counts.uncapped += 1;
    });
    return counts; // Return counts so they can be set when player is added
  };

  const togglePlayerSelection = (player) => {
    let updatedSelectedPlayers;
    if (selectedPlayers.some((p) => p.name === player.name)) {
      // Remove player
      updatedSelectedPlayers = selectedPlayers.filter(
        (p) => p.name !== player.name
      );
    } else if (selectedPlayers.length < 13) {
      // Add player
      updatedSelectedPlayers = [...selectedPlayers, player];
    } else {
      setError("You can only select a maximum of 13 players.");
      return;
    }

    // Update the selected players list
    setSelectedPlayers(updatedSelectedPlayers);

    // Recalculate the role counts based on the updated selection
    updateRoleCountsAfterSelection(updatedSelectedPlayers);
  };
  const updateRoleCountsAfterSelection = (newSelectedPlayers) => {
    const counts = {
      batsman: 0,
      wicketkeeper: 0,
      bowler: 0,
      allrounder: 0,
      uncapped: 0,
    };

    newSelectedPlayers.forEach((player) => {
      if (player.role === "Batsman" || player.role === "Wicketkeeper Batter")
        counts.batsman += 1;
      if (player.role === "Wicketkeeper Batter") counts.wicketkeeper += 1;
      if (player.role === "bowler") counts.bowler += 1;
      if (player.role === "Allrounder") counts.allrounder += 1;
      if (player.capped === 0) counts.uncapped += 1;
    });

    // Update role counts state
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
  const handleSubmit = async () => {
    if (teamDetails.players.length !== 13) {
      setError("Please buy atleast 13 players first");
      return;
    }
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
      const teamRef = doc(db, "submissions", teamDetails.name);

      await setDoc(teamRef, {
        submittedPlayers: selectedPlayers,
        closingBudget: teamDetails.budget,
        averageRating,
      });

      alert("Team submitted successfully!");
      setError("");
    } catch (error) {
      console.error("Error submitting team:", error);
    }
  };

  if (loading)
    return (
      <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex justify-center items-center">
        <p className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-100 text-4xl">
          Loading your team details...
        </p>
      </div>
    );
  if (!teamDetails)
    return (
      <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex justify-center items-center">
        <p className="font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-100 text-4xl">
          You are not currently part of any team.
        </p>
      </div>
    );

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex flex-col items-center">
      <div className="absolute top-7 right-40 p-7">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Submit Team
        </button>
      </div>

      <h1 className="font-amsterdam text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-violet-400 p-4">
        {teamDetails.name} Dashboard
      </h1>

      <div className="flex flex-col items-center mb-6">
        <p className="font-amsterdam text-6xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-100 p-2">
          Budget Remaining: ₹{" "}
          <ScramblingTextRename text={teamDetails.budget.toFixed(2)} /> crores
        </p>
        <p className="font-amsterdam text-5xl text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-300">
          Players Bought: {teamDetails.players.length}/13
        </p>
        <p className="font-amsterdam text-4xl text-red-500 m-4">{error}</p>
      </div>

      <div className="flex justify-between mb-6 w-full max-w-2xl bg-slate-800 p-6 rounded-lg shadow-md">
        <div>
          <h2 className="text-4xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4 ">
            Players Bought:
          </h2>
          <ul className="text-3xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200">
            {roleCountArray.map(({ role, count }) => (
              <li key={role}>
                {role}: {count}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-4xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4">
            Players Selected:
          </h2>
          <ul className="text-3xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200">
            <li>Batsmen: {roleCounts.batsman}/5</li>
            <li>Wicketkeepers: {roleCounts.wicketkeeper}/1 </li>
            <li>Bowlers: {roleCounts.bowler}/4</li>
            <li>Allrounders: {roleCounts.allrounder}/2</li>
            <li>Uncapped: {roleCounts.uncapped}/1</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full max-w-8xl">
        {teamDetails.players.map((player) => (
          <div
            key={player.name}
            className={`p-4 border rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-transform ${
              selectedPlayers.some((p) => p.name === player.name)
                ? "bg-blue-400/30"
                : "bg-slate-800"
            }`}
            onClick={() => togglePlayerSelection(player)}
          >
            <img
              src={player.images}
              alt={player.name}
              className="w-32 h-32 mx-auto mb-4 rounded-full object-cover"
            />
            <h3 className="text-4xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300">
              {player.name}
            </h3>
            <p className="text-3xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
              {player.role}
            </p>
            <p className="text-3xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
              Rating:{" "}
              <span className="font-amsterdam text-3xl text-transparent bg-clip-text bg-gradient-to-t from-red-500 to-yellow-300">
                {" "}
                {player.rating}{" "}
              </span>
            </p>
            <p className="text-3xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-slate-700 to-slate-100">
              {player.capped ? "capped" : "uncapped"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamPage;
