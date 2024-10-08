
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import jwtDecode from 'jwt-decode';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const signupUrl = 'http://localhost:4001';
const loginUrl = 'http://localhost:4002';
const refreshTokenUrl = `${backendUrl}/refresh-token`;

function HomePage() {
  return <h2>Home Page</h2>;
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${loginUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const token = data.token;

      // Store token in localStorage
      localStorage.setItem('authToken', token);

      console.log('Login successful. Token:', token);
      navigate('/profile');

    } catch (error) {
      console.error('Login error:', error.message);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login Page</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
}

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const decoded = jwtDecode(token);
          // Check if the token is expired and refresh it if necessary
          const now = Date.now() / 1000;
          if (decoded.exp < now) {
            await refreshToken();
          } else {
            const response = await fetch(`${backendUrl}/profile`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (!response.ok) {
              throw new Error('Failed to fetch profile');
            }
            const data = await response.json();
            setProfile(data);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile({
          name: 'John Doe',
          email: 'john.doe@fake.com',
        });
      }
    };

    fetchProfile();
  }, []);

  const refreshToken = async () => {
    try {
      const response = await fetch(refreshTokenUrl, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      const data = await response.json();
      localStorage.setItem('authToken', data.token); // Store the new token
    } catch (error) {
      console.error('Error refreshing token:', error);
      navigate('/login'); // Redirect to login if refresh fails
    }
  };

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const wallet = accounts[0];
        setWalletAddress(wallet);

        const body = JSON.stringify({ walletAddress: wallet, email: profile.email });
        const response = await fetch(`${backendUrl}/connect-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to connect wallet');
        }

        console.log('Wallet connected:', await response.json());
        setShowPopup(false);
      } catch (error) {
        console.error('Error connecting wallet:', error.message);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to connect your wallet.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear the token
    navigate('/login'); // Redirect to login
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="container">
      <h2>Profile Page</h2>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Name: {profile.name}</h5>
          <p className="card-text">Email: {profile.email}</p>
          <p className="card-text">Wallet Address: {walletAddress || 'Not connected'}</p>
          <button className="btn btn-primary" onClick={() => setShowPopup(true)}>
            Connect Wallet
          </button>
          <button className="btn btn-danger ms-2" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h5>Connect your MetaMask Wallet</h5>
            <button className="btn btn-success" onClick={handleConnectWallet}>
              Connect MetaMask
            </button>
            <button className="btn btn-secondary" onClick={() => setShowPopup(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function RegisterPage() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    try {
      console.log("Sending request to signup");
      const response = await fetch(`${signupUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          surname,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration error');
      }

      console.log('Registration successful:', await response.json());
      navigate('/login'); // Redirect to login after success

    } catch (error) {
      console.error('Registration error:', error.message);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Register Page</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Surname</label>
          <input
            type="text"
            className="form-control"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <Link className="navbar-brand" to="/">CryptoBallot</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Register</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Profile</Link>
              </li>
            </ul>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
