import React from "react";
import squadsData from "../squads.json";

const PlayerRoles = () => {
  const [classifiedPlayers, setClassifiedPlayers] = React.useState({
    Batsman: [],
    Bowler: [],
    AllRounder: [],
    WicketKeeper: [],
  });

  React.useEffect(() => {
    const classifyPlayers = () => {
      const roles = {
        Batsman: [],
        Bowler: [],
        AllRounder: [],
        WicketKeeper: [],
      };

      squadsData.forEach((team) => {
        team.players.forEach((player) => {
          const role = player.stats?.role?.toLowerCase();
          if (role?.includes("batsman") && !role.includes("wicketkeeper")) {
            roles.Batsman.push(player);
          } else if (role?.includes("bowler")) {
            roles.Bowler.push(player);
          } else if (
            role?.includes("all-rounder") ||
            role?.includes("allrounder")
          ) {
            roles.AllRounder.push(player);
          } else if (role?.includes("wicketkeeper")) {
            roles.WicketKeeper.push(player);
          }
        });
      });

      setClassifiedPlayers(roles);
    };

    classifyPlayers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      {Object.keys(classifiedPlayers).map((role) => (
        <div key={role} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{role}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classifiedPlayers[role].map((player) => (
              <div
                key={player.name}
                className="border rounded-lg p-4 shadow-md"
              >
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-20 h-20 rounded-full mb-4"
                />
                <h3 className="text-lg font-semibold">{player.name}</h3>
                <a
                  href={player.profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Profile
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerRoles;
