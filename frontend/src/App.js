import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

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

  // Fetch user's name from localStorage on component mount
  useEffect(() => {
    const storedName = localStorage.getItem('userName'); // Load the name from backend
    if (storedName) {
      setUserName(storedName);
    }
    setBallots(dummyBallots); // Load dummy ballots (can replace with API call)
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
  // Simulate login logic
  const handleLogin = () => {
    fetch(`${backendUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    localStorage.setItem('token', 'dummyToken'); // Save token to localStorage
    setIsLoggedIn(true); // Set login state
  };
  
  return (
    <div>
      <h2>Login Page</h2>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

// Register component
const Register = () => <h2>Register Page</h2>;

// Profile component
const Profile = () => <h2>Profile Page</h2>;

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