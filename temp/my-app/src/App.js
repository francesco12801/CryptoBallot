import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Wallet, LogIn, Home as HomeIcon, Menu } from 'lucide-react';

const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
    <div className="container">
      <Link to="/" className="navbar-brand d-flex align-items-center">
        <Menu className="me-2" /> CryptoBallot
      </Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <Link to="/" className="nav-link d-flex align-items-center">
              <HomeIcon className="me-1" /> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/login" className="nav-link d-flex align-items-center">
              <LogIn className="me-1" /> Login
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/wallet" className="nav-link d-flex align-items-center">
              <Wallet className="me-1" /> Wallet
            </Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
);

const HomePage = () => (
  <div className="container mt-5">
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Welcome to CryptoBallot</h2>
        <p className="card-text">CryptoBallot is a secure and transparent voting platform leveraging blockchain technology.</p>
        <ul className="list-group list-group-flush">
          <li className="list-group-item">Ensure the integrity of your votes</li>
          <li className="list-group-item">Participate in various types of elections</li>
          <li className="list-group-item">View real-time results</li>
        </ul>
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', email, password);
    navigate('/wallet');
  };

  return (
    <div className="container mt-5">
      <div className="card mx-auto" style={{maxWidth: '400px'}}>
        <div className="card-body">
          <h2 className="card-title mb-4">Login to Your Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                id="email" 
                type="email" 
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                id="password" 
                type="password" 
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Log In</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const WalletPage = () => (
  <div className="container mt-5">
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Your CryptoBallot Wallet</h2>
        <p className="card-text">Manage your voting tokens and view your voting history.</p>
        <div className="alert alert-info">
          <h3 className="alert-heading">Available Tokens: 100 CBT</h3>
          <p className="mb-0">These tokens represent your voting power in upcoming elections.</p>
        </div>
        <button className="btn btn-primary">Participate in Active Elections</button>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="min-vh-100 bg-light">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;