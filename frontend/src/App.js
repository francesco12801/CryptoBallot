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
  const [ballots, setBallots] = useState([]);
  const [userName, setUserName] = useState('Guest');

  useEffect(() => {
    // Dummy data for ballots
    setBallots([
      { id: 1, title: 'Presidential Election', expiresIn: '2 hours' },
      { id: 2, title: 'City Mayor Election', expiresIn: '1 day' },
      { id: 3, title: 'School Board Election', expiresIn: '3 hours' },
      { id: 4, title: 'Climate Action Referendum', expiresIn: '12 hours' },
    ]);
    const fetchUserName = async (token) => {
      try {
        const response = await fetch(`${backendUrl}/username`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('Data:', data);
        if (!response.ok) {
          setUserName('Guest'); // Fallback to 'Guest' if there's an error
        } else {
          setUserName(data.name);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('Guest'); // Fallback to 'Guest' if there's an error
      }
    };
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserName(token);
    }
  }, []);

  return (
    <div className="container">
      <h1>Welcome to CryptoBallot, {userName}</h1>
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
      setIsLoggedIn(true);
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
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
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

// Profile Component
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
    setProfile(null); // Clear the profile state
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
          <Link to="/profile/friends" className="btn btn-primary ms-2">Your Friends</Link>
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

// Other profile component
const OtherProfile = ({isLoggedIn}) => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${backendUrl}/profile/${id}`);
        if (!response.ok) {
          console.error('Error fetching profile:', response.statusText);
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile({
          name: 'John Doe',
          email: 'placeholder@placeholder.com',
        });
      }
    }

    const checkFriend = async () => {
      console.log("checking friends");
      try {
        const response = await fetch(`${backendUrl}/friends/check/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        if (response.status == 404) {
          console.log("not friends");
          setIsFriend = false;
        } else if (response.ok) {
          console.log("friends");
          setIsFriend(true);
          setMessage(`You and ${profile?.name || 'this user'} are friends`);
        }
      } catch(error) {
        console.error(error);
      }
    }

    console.log("fetching profile");
    fetchProfile();
    console.log("checking friends");
    checkFriend();
  }, [id]);

  const handleSendRequest = async () => {
    try {
      const response = await fetch(`${backendUrl}/friends/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId: id }),
      }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error + errorData.friendId || 'Failed to send friend request');
      }
      if (response.ok) {
        setMessage('Friend request sent successfully');
        setIsFriend(true);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError(error.message);
    }
  };
  
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="container">
      <h2>{profile.name}'s Profile Page</h2>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Name: {profile.name}</h5>
          <p className="card-text">Email: {profile.email}</p>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {isLoggedIn && !isFriend &&(
        <button id="request-button" className="btn btn-primary" onClick={handleSendRequest}>
          Send Friend Request
        </button>
      )}
    </div>
  );
};

// Register component
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
// Ballot component
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

// Main Friends component
const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the list of friends from the backend
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${backendUrl}/friends`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        setFriends(data);
      } catch (error) {
        setError('Error fetching friends');
        console.error('Error fetching friends:', error);
      }
    };

    // Fetch pending friend requests
    const fetchPendingRequests = async () => {
      try {
        const response = await fetch(`${backendUrl}/friends/pending`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        setPendingRequests(data);
      } catch (error) {
        setError('Error fetching pending requests');
        console.error('Error fetching pending requests:', error);
      }
    };

    // Fetch incoming friend requests
    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(`${backendUrl}/friends/requests`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        setFriendRequests(data);
      } catch (error) {
        setError('Error fetching friend requests');
        console.error('Error fetching friend requests:', error);
      }
    };

    fetchFriends();
    fetchPendingRequests();
    fetchFriendRequests();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container">
      <h2>My Friends</h2>
      <ul>
        {friends.length === 0 ? (
          <li>No friends added yet.</li>
        ) : (
          friends.map((friend) => (
            <li key={friend.id}>{friend.name}</li>
          ))
        )}
      </ul>

      <h2>Pending Friend Requests</h2>
      <ul>
        {pendingRequests.length === 0 ? (
          <li>No pending requests.</li>
        ) : (
          pendingRequests.map((request) => (
            <li key={request.id}>
              {request.name} ({request.email}){' '}
              <button onClick={() => acceptFriendRequest(request.id)}>Accept</button>
              <button onClick={() => rejectFriendRequest(request.id)}>Reject</button>
            </li>
          ))
        )}
      </ul>

      <h2>Friend Requests Sent</h2>
      <ul>
        {friendRequests.length === 0 ? (
          <li>No outgoing requests.</li>
        ) : (
          friendRequests.map((request) => (
            <li key={request.id}>{request.name}</li>
          ))
        )}
      </ul>
    </div>
  );
};

// Helper function to accept a friend request
const acceptFriendRequest = async (requestId) => {
  try {
    const response = await fetch(`${backendUrl}/friends/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestId }),
    });
    const data = await response.json();
    if (data.error) {
      console.error('Error accepting request:', data.error);
    } else {
      console.log('Friend request accepted:', data.message);
      window.location.reload(); // Refresh the page after accepting
    }
  } catch (error) {
    console.error('Error accepting request:', error);
  }
};

// Helper function to reject a friend request
const rejectFriendRequest = async (requestId) => {
  try {
    const response = await fetch(`${backendUrl}/friends/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestId }),
    });
    const data = await response.json();
    if (data.error) {
      console.error('Error rejecting request:', data.error);
    } else {
      console.log('Friend request rejected:', data.message);
      window.location.reload(); // Refresh the page after rejecting
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
  }
};

//App component
const App = () => {
  const [userName, setUserName] = useState('Guest'); // Default to 'Guest'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for login state from localStorage on component mount
  useEffect(() => {
    const fetchUserName = async (token) => {
      try {
        const response = await fetch(`${backendUrl}/username`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('Data:', data);
        if (!response.ok) {
          setUserName('Guest'); // Fallback to 'Guest' if there's an error
          setIsLoggedIn(false);
        } else {
          setUserName(data.name);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('Guest'); // Fallback to 'Guest' if there's an error
      }
    };
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserName(token);
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear the token
    setIsLoggedIn(false); // Update the state to logged out
    window.location.href = '/'; // Redirect to home page
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
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn}/>} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/friends" element={<Friends />} />
        <Route path="/profiles/:id" element={<OtherProfile isLoggedIn={isLoggedIn} />} />
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