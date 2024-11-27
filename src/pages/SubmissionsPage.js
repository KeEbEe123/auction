import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const submissionsRef = collection(db, "submissions");
      const querySnapshot = await getDocs(submissionsRef);

      const submissionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSubmissions(submissionsData);
    };

    fetchSubmissions();
  }, []);

  return (
    <div className="p-8 bg-custom-pattern bg-slate-950 min-h-screen flex flex-col items-center">
      <h1 className="font-amsterdam text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-8">
        Submissions
      </h1>

      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="w-full max-w-5xl bg-slate-800 p-6 rounded-lg shadow-md mb-6"
        >
          <h2 className="text-6xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mb-4">
            Team: {submission.id}
          </h2>
          <p className="font-amsterdam text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200">
            Closing Budget: ₹{submission.closingBudget}
          </p>
          <p className="font-amsterdam text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200">
            Average Rating: {submission.averageRating}
          </p>
          <h3 className="text-xl font-amsterdam text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 mt-4">
            Submitted Players:
          </h3>
          <ul>
            {submission.submittedPlayers.map((player, index) => (
              <li
                key={index}
                className="font-amsterdam text-2xl text-transparent bg-clip-text bg-gradient-to-t from-slate-400 to-slate-200"
              >
                {player.name} - {player.role} (Rating: {player.rating})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default SubmissionsPage;
