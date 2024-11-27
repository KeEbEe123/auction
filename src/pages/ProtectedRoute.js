import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";

const allowedEmails = [
  "keertan.genai@gmail.com",
  "pekkawarriorjr@gmail.com",
  "sirajmohd0911@gmail.com",
  "siddhartht4206@gmail.com",
];

function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  // Show a loading spinner or placeholder while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-gray-500">Loading...</p>
      </div>
    );
  }

  // Redirect to homepage if the user is not authenticated
  if (!user) {
    return <Navigate to="/" />;
  }

  // Check if the user is allowed
  if (!allowedEmails.includes(user.email)) {
    return (
      <div className="p-8 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl text-red-500">Access Denied</h1>
        <p className="text-xl mt-4">
          Your account does not have permission to access this page.
        </p>
      </div>
    );
  }

  // Render the children if all checks pass
  return children;
}

export default ProtectedRoute;
