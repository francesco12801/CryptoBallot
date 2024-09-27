import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Login Component
const Login = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">
          Register here
        </button>
      </p>
    </div>
  );
};

// Registration Component
const Register = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    onRegister(username, password);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">
          Login here
        </button>
      </p>
    </div>
  );
};

// Homepage Component
const Homepage = ({ onLogout }) => {
  const [selectedBallot, setSelectedBallot] = useState(null);
  const ballots = [
    { id: 1, name: 'City Council Election' },
    { id: 2, name: 'School Board Election' },
    { id: 3, name: 'Local Referendum' },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Welcome to the Voting System</h2>
        <button onClick={onLogout} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Logout
        </button>
      </div>
      <h3 className="text-xl font-semibold mb-4">Available Ballots:</h3>
      <div className="space-y-4">
        {ballots.map((ballot) => (
          <div key={ballot.id} className="flex items-center p-4 bg-gray-100 rounded-lg">
            <input
              type="radio"
              id={`ballot-${ballot.id}`}
              name="ballot"
              value={ballot.id}
              checked={selectedBallot === ballot.id}
              onChange={() => setSelectedBallot(ballot.id)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label htmlFor={`ballot-${ballot.id}`} className="ml-3 block text-sm font-medium text-gray-700">
              {ballot.name}
            </label>
          </div>
        ))}
      </div>
      {selectedBallot && (
        <button className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Proceed to Voting
        </button>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [error, setError] = useState(null);

  const handleLogin = (username, password) => {
    // Here you would typically make an API call to verify credentials
    console.log('Login attempt:', username, password);
    setIsLoggedIn(true);
    setError(null);
  };

  const handleRegister = (username, password) => {
    // Here you would typically make an API call to register the user
    console.log('Register attempt:', username, password);
    setIsLoggedIn(true);
    setError(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogin(true);
  };

  if (isLoggedIn) {
    return <Homepage onLogout={handleLogout} />;
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {showLogin ? (
        <Login onLogin={handleLogin} onSwitchToRegister={() => setShowLogin(false)} />
      ) : (
        <Register onRegister={handleRegister} onSwitchToLogin={() => setShowLogin(true)} />
      )}
    </div>
  );
};

export default App;
