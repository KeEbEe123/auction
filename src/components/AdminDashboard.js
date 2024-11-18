import { db } from "../firebase/config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

function AdminDashboard() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      const playerCollection = collection(db, "players");
      const playerSnapshot = await getDocs(playerCollection);
      setPlayers(playerSnapshot.docs.map((doc) => doc.data()));
    };
    fetchPlayers();
  }, []);

  const startAuctionForPlayer = async (player) => {
    await updateDoc(doc(db, "auction", "currentAuction"), {
      player,
      isActive: true,
      currentBid: player.startingBid,
    });
    setSelectedPlayer(player);
  };

  return (
    <div>
      <h1 className="text-xl font-bold">Admin Dashboard</h1>
      {players.map((player) => (
        <PlayerCard
          key={player.Sno}
          player={player}
          onSelect={() => startAuctionForPlayer(player)}
        />
      ))}
    </div>
  );
}
