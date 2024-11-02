import { ethers } from 'ethers';
import { JsonRpcProvider } from "ethers";
import { BigNumber } from "ethers";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import jwtDecode from 'jwt-decode';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import abi from './abi.json';
import BallotManager from './ballot-manager.js';

const contractAddress = '0x26f563Fa3413e6206B16591f2fD6161f5D44c81F';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const signupUrl = 'http://localhost:4001';
const loginUrl = 'http://localhost:4002';
const refreshTokenUrl = `${backendUrl}/refresh-token`;


// Homepage component
const Home = ({ signer }) => {
  const [ballots, setBallots] = useState([]);
  const [expiredBallots, setExpiredBallots] = useState([]);
  const [userName, setUserName] = useState('Guest');

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
        } else {
          setUserName(data.name);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('Guest'); // Fallback to 'Guest' if there's an error
      }
    };

    const fetchAllBallots = async () => {
      try {
        if (!signer) {
          throw new Error('Signer not available');
        }
        let ballotManager = new BallotManager(contractAddress, abi, signer);
        let { ballots, expiredBallots } = await ballotManager.getAllBallots();
        console.log('Ballots:', ballots);
        setBallots(ballots);
        setExpiredBallots(expiredBallots);
      } catch (error) {
        console.error('Error fetching ballots:', error);
      }
    };
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserName(token);
    }
    fetchAllBallots();
  }, []);

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (mins > 0) result += `${mins} minute${mins > 1 ? 's' : ''} `;
    if (secs > 0) result += `${secs} second${secs > 1 ? 's' : ''}`;

    return result.trim();
  };

  return (
    <div className="container">
      <h1>Welcome to CryptoBallot, {userName}</h1>
      {signer ? (
        <>
          <h2>All available ballots</h2>
          <div className="row">
          {ballots.map((ballot) => (
              <div className="col-md-4" key={ballot.id}>
                <div className="card mb-4 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{ballot.title}</h5>
                    <p className="card-text">Created By {ballot.creatorAddress}</p>
                    <p className="card-text">Ends in {formatDuration(ballot.expiresIn)}</p>
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

          <h2>Expired ballots</h2>
          <div className="row">
          {expiredBallots.map((ballot) => (
              <div className="col-md-4" key={ballot.id}>
                <div className="card mb-4 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{ballot.title}</h5>
                    <p className="card-text">Created By {ballot.creatorAddress}</p>
                    <button className="btn btn-primary">
                      <Link to={`/ballot/${ballot.id}`} className="text-white">
                        See Results
                      </Link>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Please log in and connect your wallet to view and vote on ballots.</p>
      )}
    </div>
  );
};
const BallotDetail = ({ signer }) => {
  const { id } = useParams(); // Get ballot ID from route
  const [ballot, setBallot] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [message, setMessage] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const fetchBallot = async () => {
      try {
        let ballotManager = new BallotManager(contractAddress, abi, signer);
        let ballotData = await ballotManager.getBallot(id);
        setBallot(ballotData);
      } catch (error) {
        console.error('Error fetching ballot:', error);
      }
    };

    const checkBookmark = async () => {
      console.log("Checking bookmark");
      try {
        const response = await fetch(`${backendUrl}/check-bookmark`, {
          method: 'POST',
          headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ballotId: id }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Bookmarked", data.bookmarked);
          setBookmarked(data.bookmarked);
        }
      } catch (error) {
        console.error('Error checking bookmark:', error);
      }
    }
    fetchBallot();
    checkBookmark();
  }, [id, signer]);

  const handleVote = async () => {
    if (selectedOption == null) {
      setMessage('Please select an option to vote.');
      return;
    }
  
    try {
      let ballotManager = new BallotManager(contractAddress, abi, signer);
      
      // Check the ballot type to determine which vote function to call
      if (ballot.type === 'AB') {
        await ballotManager.voteBallotAB(id, selectedOption);
      } else if (ballot.type === 'ME') {
        await ballotManager.voteBallotME(id, selectedOption);
      } else {
        throw new Error('Invalid ballot type');
      }
      
      setMessage('Vote cast successfully!');
    } catch (error) {
      console.error('Error voting:', error);
      setMessage('Failed to cast vote.');
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await fetch(`${backendUrl}/${bookmarked ? 'bookmarks/remove' : 'bookmarks/add'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ballotId: id }),
      });
      if (response.ok) {
        setBookmarked(!bookmarked);
        console.log(response.json());
      } else {
        console.error('Error updating bookmark status');
      }
    } catch (error) {
      console.error('Error updating bookmark status:', error);
    }
  };

  if (!ballot) return <p>Loading ballot details...</p>;

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (mins > 0) result += `${mins} minute${mins > 1 ? 's' : ''} `;
    if (secs > 0) result += `${secs} second${secs > 1 ? 's' : ''}`;

    return result.trim();
  };

  const isExpired = ballot.expiresIn <= 0; // Check if the ballot has expired
  console.log("################# is expired is   #############" + isExpired);
  return (
    <div className="container">
      <h2>{ballot.title}</h2>
      <p>Created by {ballot.creatorAddress}</p>
    
      {isExpired ? (
        <div className="container">
          <h2>{ballot.title}</h2>
          <p>Ballot ended</p>
          <p>Created by {ballot.creatorAddress}</p>
          {ballot.type === 'AB' ? (
            <ul>
              {ballot.option0 && <li>Option 0: {ballot.option0} - {ballot.votes0}</li>}
              {ballot.option1 && <li>Option 1: {ballot.option1} - {ballot.votes1}</li>}
            </ul>
          ) : (
            <ul>
              {ballot.options.map((option, index) => (
                option && <li key={index}>Option {index}: {option} - {ballot.votes[index]} votes</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <h2>{ballot.title}</h2>
          {ballot.expiresIn > 0 && <p>Ends in {formatDuration(ballot.expiresIn)}</p>}
          <h3>Options</h3>
          {ballot.options.map((option, index) => (
            option && (
              <div key={index}>
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="vote"
                  value={index}
                  onChange={() => setSelectedOption(index)}
                />
                <label htmlFor={`option-${index}`}>{option}</label>
              </div>
            )
          ))}

          <button onClick={handleVote} className="btn btn-primary mt-3">Submit Vote</button>
        </div>
      )}

      <button 
        onClick={handleBookmark} 
        className={`btn ${bookmarked ? 'btn-danger' : 'btn-secondary'} mt-3`}
      >
        {bookmarked ? 'Remove from Bookmarks' : 'Add to Bookmarks'}
      </button>

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
};



// Login component
const Login = ({ setIsLoggedIn, setSigner }) => {
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

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setSigner(signer);

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
const Profile = ({ setSigner }) => {
  const [profile, setProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
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

        // Richiede l'accesso all'account Ethereum

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Connesso all'account:", accounts[0]);


        // Crea un provider e un signer che permettono di interagire con la blockchain


        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setSigner(signer);
        const wallet = await signer.getAddress();
        setWalletAddress(wallet);

        // Invia la richiesta di connessione al backend per associare l'indirizzo del wallet all'account utente

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


        // Crea un'istanza del manager per poter chiamare la funzione startUser  


        try {
          setInfo('Connecting wallet...');
          let ballotManager = new BallotManager(contractAddress, abi, signer);
          let startUser = await ballotManager.startUser();

          console.log("Transazione inviata:", startUser);

          setInfo('Wallet Connected successfully, you can now return to the homepage to cast votes');
        } catch (error) {
          console.error('Error calling function StartUser:', error.message);
          setError('Error connecting wallet');
        }


        // Call alla funzione successiva sempre tramite manager 
        // We have to create a new instance of the BallotManager class to call the getUserInfo function
        // otherwise the try-catch is useless
        try {
          let ballotManager = new BallotManager(contractAddress, abi, signer);
          let userInfo = await ballotManager.getUserInfo(wallet);
          console.log("User info:", userInfo);
        } catch (error) {
          console.error('Error calling function getUserInfo:', error.message);
        }

      } catch (error) {
        console.error('Error connecting wallet:', error.message);
      }
      setShowPopup(false);
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
      {info && <div className="alert alert-success">{info}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

// Other profile component
const OtherProfile = ({ isLoggedIn }) => {
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
      } catch (error) {
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
      {isLoggedIn && !isFriend && (
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
const Ballot = ({ signer }) => {
  const { id } = useParams();
  const [ballot, setBallot] = useState(null);

  useEffect(() => {
    // Fetch the ballot data from the backend
    const fetchBallot = async () => {
      let ballotManager = new BallotManager(contractAddress, abi, signer);
      let ballotData = await ballotManager.getBallot(id);
      setBallot(ballotData);
    };

    fetchBallot();
  }, [id]);

  if (!ballot) {
    return <div>Loading...</div>;
  }

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (mins > 0) result += `${mins} minute${mins > 1 ? 's' : ''} `;
    if (secs > 0) result += `${secs} second${secs > 1 ? 's' : ''}`;

    return result.trim();
  };

  return (
    <div className="container">
      <h2>{ballot.title}</h2>
      {ballot.expiresIn > 0 && <p>Ends in {formatDuration(ballot.expiresIn)}</p>}
      <p>Created by {ballot.creatorAddress}</p>
      {ballot.type === 'AB' ? (
        <ul>
          {ballot.option0 && <li>Option 0: {ballot.option0} - {ballot.votes0}</li>}
          {ballot.option1 && <li>Option 1: {ballot.option1} - {ballot.votes1}</li>}
        </ul>
      ) : (
        <ul>
          {ballot.options.map((option, index) => (
            option && <li key={index}>Option {index}: {option} - {ballot.votes[index]} votes</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// New Ballot Component
const NewBallot = ({ signer }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('AB');
  const [options, setOptions] = useState(['', '']);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = () => {
    if (options.length > 3) {
      setOptions(options.slice(0, -1));
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setOptions(newType === 'AB' ? ['', ''] : ['', '', '']);
  };

  const calculateTotalMinutes = () => {
    return days * 1440 + hours * 60 + minutes; // 1440 = minutes in a day, 60 = minutes in an hour
  };

  const handleSubmit = () => {
    const durationInMinutes = calculateTotalMinutes();
    if (type === 'AB' && options.length !== 2) {
      console.error("Type AB must have exactly 2 options");
      setError("Type AB must have exactly 2 options");
      return;
    }
    if (type === 'ME' && (options.length < 3 || options.length > 10)) {
      console.error("Type ME must have between 3 and 10 options");
      setError("Type ME must have between 3 and 10 options");
      return;
    }
    if (durationInMinutes < 60) {
      console.error("Duration must be at least 1 hour");
      setError("Duration must be at least 1 hour");
      return;
    }
    
    const durationBigNumber = BigNumber.from(durationInMinutes);

    console.log({
      title,
      type,
      options,
      durationInMinutes
    });

    // Check first selected type
    const createBallot = async () => {
      try {
        setInfo('Creating ballot...');
        if (type === 'AB') {
          // Call the function to create the AB ballot
          let ballotManager = new BallotManager(contractAddress, abi, signer);
          await ballotManager.createBallotAB(title, options[0], options[1], durationBigNumber);
          navigate('/');
        } else {
          // Call the function to create the ME ballot
          let ballotManager = new BallotManager(contractAddress, abi, signer);
          await ballotManager.createBallotME(title, options, durationBigNumber);
          navigate('/');
        }
      } catch (error) {
        console.error('Error creating ballot:', error);
      }
    };
    
    createBallot();
  };

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <h2 className="card-title">Create New Ballot</h2>

        {/* Error Popup */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Info Popup */}
        {info && (
          <div className="alert alert-info alert-dismissible fade show" role="alert">
            {info}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setInfo(null)}></button>
          </div>
        )}
        
        <div className="mb-3">
          <label className="form-label">Title:</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Type:</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            <option value="AB">AB</option>
            <option value="ME">ME</option>
          </select>
        </div>

        <div className="mb-3">
          <h3>Options</h3>
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              className="form-control mb-2"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
            />
          ))}

          {type === 'ME' && options.length < 10 && (
            <button
              type="button"
              className="btn btn-outline-primary me-2"
              onClick={handleAddOption}
            >
              Add Option
            </button>
          )}
          {type === 'ME' && options.length > 3 && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleRemoveOption}
            >
              Remove Option
            </button>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Duration (minimum one hour):</label>
          <div className="d-flex gap-3">
            <div>
              <label className="form-label">Days</label>
              <input
                type="number"
                className="form-control"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                min="0"
                placeholder="Days"
              />
            </div>
            <div>
              <label className="form-label">Hours</label>
              <input
                type="number"
                className="form-control"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                min="0"
                max="23"
                placeholder="Hours"
              />
            </div>
            <div>
              <label className="form-label">Minutes</label>
              <input
                type="number"
                className="form-control"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                min="1"
                max="59"
                placeholder="Minutes"
              />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmit}>Create Ballot</button>
      </div>
    </div>
  );
};

const VoteBallot = ({ signer, contractAddress, abi }) => {
  const [ballotId, setBallotId] = useState('');
  const [type, setType] = useState('AB');
  const [option, setOption] = useState(0); // Default selected option
  const [error, setError] = useState(null);

  const handleVote = async () => {
    try {
      const ballotManager = new BallotManager(contractAddress, abi, signer);
      if (type === 'AB') {
        await ballotManager.voteBallotAB(BigNumber.from(ballotId), BigNumber.from(option));
      } else if (type === 'ME') {
        await ballotManager.voteBallotME(BigNumber.from(ballotId), BigNumber.from(option));
      }
      alert('Vote cast successfully!');
    } catch (err) {
      console.error('Error casting vote:', err);
      setError('Failed to cast vote. Please check the ballot ID and option.');
    }
  };

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <h2 className="card-title">Vote on a Ballot</h2>

        {/* Error Popup */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)}></button>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Ballot ID:</label>
          <input
            type="text"
            className="form-control"
            value={ballotId}
            onChange={(e) => setBallotId(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Ballot Type:</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="AB">AB</option>
            <option value="ME">ME</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Option:</label>
          <input
            type="number"
            className="form-control"
            min="0"
            value={option}
            onChange={(e) => setOption(Number(e.target.value))}
          />
          <small className="form-text text-muted">Enter the option index you want to vote for.</small>
        </div>

        <button className="btn btn-primary" onClick={handleVote}>
          Cast Vote
        </button>
      </div>
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

// Bookmarks component
const Bookmarks = ({signer}) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [ballots, setBallots] = useState([]);
  const [expiredBallots, setExpiredBallots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`${backendUrl}/bookmarks`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        console.log('Bookmarks:', data);
        const bookmarkIds = data.map(bookmark => bookmark.ballot_id);
        setBookmarks(bookmarkIds);
      }
      catch (error) {
        setError('Error fetching bookmarks');
        console.error('Error fetching bookmarks:', error);
      }
    }
    fetchBookmarks();
  }, []);

  useEffect(() => {
    const fetchBallots = async () => {
      try {
        if (!signer) {
          throw new Error('Wallet not connected');
        }
        let ballotManager = new BallotManager(contractAddress, abi, signer);
        let { ballots, expiredBallots } = await ballotManager.getBallots(bookmarks);
        setBallots(ballots);
        setExpiredBallots(expiredBallots);
      } catch (error) {
        setError('Error fetching ballots:', error);
        console.error('Error fetching ballots:', error);
      }
    };
    fetchBallots();
  }, [bookmarks]);

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (mins > 0) result += `${mins} minute${mins > 1 ? 's' : ''} `;
    if (secs > 0) result += `${secs} second${secs > 1 ? 's' : ''}`;

    return result.trim();
  };

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  return (
    <div className="container">
      {error && <div className="alert alert-danger">{error}</div>}
      <h2>Active Bookmarked Ballots</h2>
      <div className="row">
      {ballots.map((ballot) => (
          <div className="col-md-4" key={ballot.id}>
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{ballot.title}</h5>
                <p className="card-text">Created By {ballot.creatorAddress}</p>
                <p className="card-text">Ends in {formatDuration(ballot.expiresIn)}</p>
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

      <h2>Expired Bookmarked Ballots</h2>
      <div className="row">
      {expiredBallots.map((ballot) => (
          <div className="col-md-4" key={ballot.id}>
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{ballot.title}</h5>
                <p className="card-text">Created By {ballot.creatorAddress}</p>
                <button className="btn btn-primary">
                  <Link to={`/ballot/${ballot.id}`} className="text-white">
                    See Results
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

//App component
const App = () => {
  const [userName, setUserName] = useState('Guest'); // Default to 'Guest'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signer, setSigner] = useState(null);

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
              {isLoggedIn && (
                <li className="nav-item">
                  <Link className="nav-link" to="/new-ballot">
                    New Ballot
                  </Link>
                </li>
              )}
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
                    <Link className="nav-link" to="/bookmarks">
                      Bookmarks
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
        <Route path="/" element={<Home signer={signer} />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setSigner={setSigner} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile setSigner={setSigner} />} />
        <Route path="/profile/friends" element={<Friends />} />
        <Route path="/profiles/:id" element={<OtherProfile isLoggedIn={isLoggedIn} />} />
        <Route path="/ballot/:id" element={<BallotDetail signer={signer} />} />
        <Route path="/new-ballot" element={<NewBallot signer={signer} />} />
        <Route path="/bookmarks" element={<Bookmarks signer={signer} />} />
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