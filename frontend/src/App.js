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

// Dummy data for ballots
const dummyBallots = [
  { id: 1, title: 'Presidential Election', expiresIn: '2 hours' },
  { id: 2, title: 'City Mayor Election', expiresIn: '1 day' },
  { id: 3, title: 'School Board Election', expiresIn: '3 hours' },
  { id: 4, title: 'Climate Action Referendum', expiresIn: '12 hours' },
];

// Homepage component
const Home = () => {
  const [userName, setUserName] = useState('Guest'); // Default to 'Guest'
  const [ballots, setBallots] = useState([]);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${backendUrl}/username`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setUserName(data.name);
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('Guest'); // Fallback to 'Guest' if there's an error
      }
    };

    fetchUserName();
  }, []);

  return (
    <div className="container">
      <h1>Hi, {userName}!</h1>
      <h2>Almost expired ballots</h2>

      <div className="row">
        {ballots.map((ballot) => (
          <div className="col-md-4" key={ballot.id}>
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{ballot.title}</h5>
                <p className="card-text">Ends in {ballot.expiresIn}</p>
                <button className="btn btn-primary">
                  <Link to={`/ballot/${ballot.id}`} className="text-white">
                    Vote Now
                  </Link>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2>All available ballots</h2>
      <div className="row">
        {ballots.map((ballot) => (
          <div className="col-md-4" key={ballot.id}>
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{ballot.title}</h5>
                <p className="card-text">Ends in {ballot.expiresIn}</p>
                <button className="btn btn-primary">
                  <Link to={`/ballot/${ballot.id}`} className="text-white">
                    Vote Now
                  </Link>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

// Login component
const Login = ({ setIsLoggedIn }) => {
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
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow" style={{ width: '400px' }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">Login</h3>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Profile component
const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${backendUrl}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to dummy data if there's an error
        const dummyProfile = {
          name: 'John Doe',
          email: 'john.doe@fake.com'
        };
        setProfile(dummyProfile);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h2>Profile Page</h2>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Name: {profile.name}</h5>
          <p className="card-text">Email: {profile.email}</p>
          {/* Add more profile details here */}
        </div>
      </div>
    </div>
  );
};

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

const Register = () => {
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
// Ballott component
const Ballot = () => {
  const { id } = useParams();
  const [ballot, setBallot] = useState(null);

  useEffect(() => {
    // Fetch the ballot data from the backend
    const fetchBallot = async () => {
      try {
        const response = await fetch(`${backendUrl}/ballots/${id}`);
        const data = await response.json();
        setBallot(data);
      } catch (error) {
        console.error('Error fetching ballot:', error);
        // Fallback to dummy data if there's an error
        const dummyBallot = dummyBallots.find(ballot => ballot.id === parseInt(id));
        setBallot(dummyBallot);
      }
    };

    fetchBallot();
  }, [id]);

  if (!ballot) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h2>{ballot.title}</h2>
      <p>Expires in {ballot.expiresIn}</p>
      {/* Add more ballot details here */}
    </div>
  );
};

// About Us component
const AboutUs = () => {
  const developers = [
    {
      name: 'Marco Natale',
      description: 'A passionate full-stack developer with expertise in building scalable web applications and a focus on backend services.',
      image: 'https://via.placeholder.com/150', // Placeholder for Marco's image
    },
    {
      name: 'Francesco Tinessa',
      description: 'Front-end developer specializing in creating sleek and responsive user interfaces with modern web technologies.',
      image: 'https://via.placeholder.com/150', // Placeholder for Francesco's image
    },
    {
      name: 'Davide Fortunato',
      description: 'Backend architect, focused on designing robust and high-performance systems for complex data-driven applications.',
      image: 'https://via.placeholder.com/150', // Placeholder for Davide's image
    },
    {
      name: 'Giuseppe Macri',
      description: 'Full-stack engineer with a passion for blockchain technologies and decentralized systems development.',
      image: 'https://via.placeholder.com/150', // Placeholder for Giuseppe's image
    },
  ];

  return (
    <div className="container">
      <h1>About Us</h1>
      <div className="row">
        {developers.map((dev, index) => (
          <div className="col-md-3" key={index}>
            <div className="card mb-4 shadow-sm">
              <img src={dev.image} className="card-img-top" alt={`${dev.name}`} />
              <div className="card-body">
                <h5 className="card-title">{dev.name}</h5>
                <p className="card-text">{dev.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for login state from localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem('token'); // Check if token exists
    if (token) {
      setIsLoggedIn(true); // If token exists, user is logged in
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    setIsLoggedIn(false); // Update the state to logged out
    window.location.href = '/';
  };

  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            CryptoBallot
          </Link>

          {/* Toggler for mobile menu */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Profile</Link>
              </li>
            </ul>

            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              {/* Conditionally render buttons based on login status */}
              {!isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">
                      Register
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/profile">
                      Profile
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ballot/:id" element={<Ballot />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>

      <footer className="bg-light text-center text-lg-start">
        <div className="container p-4">
          <div className="row">
            {/* About Us Section */}
            <div className="col-lg-4 col-md-6 mb-4 mb-md-0">
              <h5 className="text-uppercase">About Us</h5>
              <p>
                CryptoBallot is your secure platform for voting on blockchain.
                We provide transparency and trust for all your election needs.
              </p>
            </div>

            {/* Useful Links Section */}
            <div className="col-lg-4 col-md-6 mb-4 mb-md-0">
              <h5 className="text-uppercase">Useful Links</h5>
              <ul className="list-unstyled">
                <li>
                  <Link to="/" className="text-dark">Home</Link>
                </li>
                <li>
                  <Link to="/contact" className="text-dark">Contact</Link>
                </li>
                <li>
                  <Link to="/about" className="text-dark">About Us</Link>
                </li>
              </ul>
            </div>

            {/* Social Links Section */}
            <div className="col-lg-4 col-md-12 mb-4 mb-md-0">
              <h5 className="text-uppercase">Follow Us</h5>
              <ul className="list-unstyled d-flex justify-content-center">
                <li className="me-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                </li>
                <li className="me-3">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-twitter"></i>
                  </a>
                </li>
                <li className="me-3">
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-instagram"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center p-3 bg-dark text-white">
          © 2024 CryptoBallot. All rights reserved.
        </div>
      </footer>
    </Router>
  );
};

export default App;