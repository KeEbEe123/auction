import React, { useState, useEffect } from "react";
import { googleSignIn, auth, db } from "../firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import logo from "../images/ipl.png";

function HomePage() {
  const [user] = useAuthState(auth);
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserTeam = async () => {
      if (!user) return;

      try {
        const teamsCollection = collection(db, "teams");
        const q = query(
          teamsCollection,
          where("members", "array-contains", user.displayName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // If the user is already in a team, get the team name and redirect to the team page
          const teamDoc = querySnapshot.docs[0];
          const teamData = teamDoc.data();
          console.log("Found user in team:", teamData.name);
          navigate("/team", { state: { teamName: teamData.name } });
        }
      } catch (error) {
        console.error("Error checking user team:", error);
      }
    };

    checkUserTeam();
  }, [user, navigate]);

  const handleSignIn = () => {
    googleSignIn().catch((error) =>
      console.error("Google Sign-In Error:", error)
    );
  };

  const handleJoinTeam = async () => {
    if (!teamName || !password) {
      setError("Please enter a team name and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if the team already exists in the teams collection
      const teamDocRef = doc(db, "teams", teamName);
      const teamDoc = await getDoc(teamDocRef);

      if (teamDoc.exists()) {
        setError("This team is already occupied. Please choose another team.");
        setLoading(false);
        return;
      }

      // Validate team credentials
      const credsDocRef = doc(db, "creds", teamName);
      const credsDoc = await getDoc(credsDocRef);

      if (!credsDoc.exists()) {
        setError("Team does not exist. Please check the team name.");
        setLoading(false);
        return;
      }

      const teamData = credsDoc.data();
      if (teamData.password !== parseInt(password)) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      // Create a new team in the teams collection
      await setDoc(teamDocRef, {
        name: teamName,
        members: [user.displayName],
        players: [],
        budget: 100,
      });

      // Redirect to the team page
      navigate("/team", { state: { teamName } });
    } catch (error) {
      console.error("Error joining team:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex flex-col items-center justify-center">
      {/* Page Title */}
      {/* <h1 className="font-amsterdam text-8xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-12 pr-4 pl-4">
        IPL Auction
      </h1> */}
      <img src={logo} className="w-[500px]"></img>
      {!user ? (
        <button
          onClick={handleSignIn}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded transition-all text-2xl shadow-lg"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="text-center">
          <p className="font-amsterdam text-4xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200 mb-8 pr-4 pl-4">
            Welcome, {user.displayName}
          </p>

          {/* Join Team Section */}
          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="py-2 px-4 rounded bg-gray-800 text-white border border-gray-600"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="py-2 px-4 rounded bg-gray-800 text-white border border-gray-600"
            />
            <button
              onClick={handleJoinTeam}
              disabled={loading}
              className={`${
                loading ? "bg-gray-500" : "bg-green-500 hover:bg-green-600"
              } text-white font-bold py-3 px-8 rounded transition-all text-xl shadow-lg`}
            >
              {loading ? "Joining..." : "Join Team"}
            </button>
            {error && <p className="text-red-500">{error}</p>}
          </div>
          {user.email === "keertan.genai@gmail.com" && (
            <Link
              to="/admin"
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded transition-all text-xl shadow-lg mt-4"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
