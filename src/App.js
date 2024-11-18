import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import AuctionRoomPage from "./pages/AuctionRoomPage";
import PlayerRoles from "./components/PlayerRoles";
import TeamPage from "./pages/TeamPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import SlideshowPage from "./pages/SlideshowPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auction-room" element={<AuctionRoomPage />} />
        <Route path="/players" element={<PlayerRoles />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/slideshow" element={<SlideshowPage />} />
      </Routes>
    </Router>
  );
}

export default App;
