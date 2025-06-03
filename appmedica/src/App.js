import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Admin from "./pages/admin";
import Paciente from "./pages/paciente";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/paciente" element={<Paciente />} />
      </Routes>
    </Router>
  );
}

export default App;

