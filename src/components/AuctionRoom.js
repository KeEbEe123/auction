import { db, auth } from "../firebase/config";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function AuctionRoom() {
  const [user] = useAuthState(auth);
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "auction", "currentAuction"),
      (doc) => {
        setCurrentAuction(doc.data());
      }
    );
    return unsubscribe;
  }, []);

  const placeBid = async () => {
    if (bidAmount > currentAuction.currentBid) {
      await updateDoc(doc(db, "auction", "currentAuction"), {
        currentBid: bidAmount,
        highestBidder: user.displayName,
      });
    }
  };

  return (
    <div>
      {currentAuction && currentAuction.isActive ? (
        <div>
          <h2>{currentAuction.player.player}</h2>
          <p>
            Highest Bid: {currentAuction.currentBid} by{" "}
            {currentAuction.highestBidder}
          </p>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
          />
          <button onClick={placeBid}>Place Bid</button>
        </div>
      ) : (
        <p>No active auction</p>
      )}
    </div>
  );
}
