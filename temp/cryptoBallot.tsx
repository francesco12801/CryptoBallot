import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Logo component
const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-10 h-10">
    <circle cx="50" cy="50" r="45" fill="#4CAF50" />
    <path d="M30 50 L45 65 L70 40" stroke="white" strokeWidth="8" fill="none" />
  </svg>
);

// Loading component
const Loading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-800">
    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
  </div>
);

// Header component
const Header = () => (
  <header className="bg-gray-800 text-white p-4">
    <div className="container mx-auto flex justify-between items-center">
      <Link to="/" className="flex items-center">
        <Logo />
        <span className="ml-2 text-xl font-bold">CryptoBallot</span>
      </Link>
      <nav>
        <ul className="flex space-x-4">
          <li><Link to="/" className="hover:text-blue-300">Home</Link></li>
          <li><Link to="/login" className="hover:text-blue-300">Login</Link></li>
          <li><Link to="/wallet" className="hover:text-blue-300">Wallet</Link></li>
        </ul>
      </nav>
    </div>
  </header>
);

// Home component
const Home = () => (
  <div className="container mx-auto mt-8 p-4">
    <h1 className="text-3xl font-bold mb-4">Welcome to CryptoBallot</h1>
    <p>Secure and transparent voting for the digital age.</p>
  </div>
);

// Login component
const Login = ({ setIsLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Implementa qui la logica di login
    setIsLoggedIn(true);
  };

  return (
    <div className="container mx-auto mt-8 p-4">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="max-w-sm">
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Login
        </button>
      </form>
      <p className="mt-4">
        Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register here</Link>
      </p>
    </div>
  );
};

// Wallet component
const Wallet = () => (
  <div className="container mx-auto mt-8 p-4">
    <h2 className="text-2xl font-bold mb-4">Your Wallet</h2>
    <p>Here you can manage your crypto assets for voting.</p>
  </div>
);

// Main App component
const App = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route
            path="/wallet"
            element={isLoggedIn ? <Wallet /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
