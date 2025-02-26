// App.jsx (example)
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login/Login';
import Register from "./pages/Register/Register";
import Method from "./pages/Method/Method";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Setting from "./pages/Setting/Setting";
import Search from "./pages/Search/Search";
import Create from './pages/Create/Create';

import { auth } from './config/firebase';  // import the already-initialized auth

function App() {
  auth.languageCode = "it";

  return (
      <Routes>
        <Route path="/" element={<Method />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/setting" element={<Setting />} />
        <Route path="/search" element={<Search />} />
        <Route path="/:username" element={<Profile />} />
        <Route path="/create" element={<Create />} />
      </Routes>
  );
}

export default App;
