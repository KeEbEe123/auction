// src/uploadPlayerData.js
import { db } from "./firebase/config";
import { collection, addDoc } from "firebase/firestore";
import playerData from "./combined_players.json";

const uploadPlayersToFirestore = async () => {
  const playerCollection = collection(db, "players");

  try {
    for (const player of playerData) {
      await addDoc(playerCollection, player);
    }
    console.log("Player data uploaded successfully.");
  } catch (error) {
    console.error("Error uploading player data: ", error);
  }
};

export default uploadPlayersToFirestore;
