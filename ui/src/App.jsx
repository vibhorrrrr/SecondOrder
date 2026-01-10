import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimulationDashboard from './components/SimulationDashboard';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<SimulationDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
