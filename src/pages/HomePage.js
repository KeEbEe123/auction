import React from "react";
import { googleSignIn } from "../firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";
import { Link } from "react-router-dom";

function HomePage() {
  const [user] = useAuthState(auth);

  const handleSignIn = () => {
    googleSignIn().catch((error) =>
      console.error("Google Sign-In Error:", error)
    );
  };

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex flex-col items-center justify-center">
      {/* Page Title */}
      <h1 className="font-starbirl text-8xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-12 pr-4 pl-4">
        IPL Auction
      </h1>

      {/* Sign-In or User Details */}
      {!user ? (
        <button
          onClick={handleSignIn}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded transition-all text-2xl shadow-lg"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="text-center">
          <p className="font-starbirl text-4xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200 mb-8 pr-4 pl-4">
            Welcome, {user.displayName}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/auction-room"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded transition-all text-xl shadow-lg"
            >
              Enter Auction Room
            </Link>
            {user.email === "admin@example.com" && (
              <Link
                to="/admin"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded transition-all text-xl shadow-lg"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
