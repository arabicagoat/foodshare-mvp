import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_NOCODB_URL || 'http://localhost:8080';
const API_KEY = process.env.REACT_APP_NOCODB_KEY;

// Helper to make API calls to NocoDB
const api = axios.create({
  baseURL: `${API_URL}/api/v2`,
  headers: API_KEY ? { 'xc-auth': API_KEY } : {}
});

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('browse');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [donations, setDonations] = useState([]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('produce');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');

  // Load donations on mount
  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await api.get('/tables/donations/records?limit=100');
      setDonations(response.data.list || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Check if user exists
      const checkResponse = await api.get(`/tables/users/records?where=(email,eq,${email})`);
      if (checkResponse.data.list.length > 0) {
        alert('Email already exists');
        return;
      }

      // Create new user
      const response = await api.post('/tables/users/records', {
        email,
        name,
        password
      });

      setUser({ id: response.data.Id, email, name });
      setEmail('');
      setPassword('');
      setName('');
      setTab('browse');
    } catch (err) {
      alert('Signup failed: ' + err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get(`/tables/users/records?where=(email,eq,${email})`);
      const users = response.data.list;
      
      if (users.length === 0) {
        alert('User not found');
        return;
      }

      const foundUser = users;
      if (foundUser.password !== password) {
        alert('Incorrect password');
        return;
      }

      setUser({ id: foundUser.Id, email: foundUser.email, name: foundUser.name });
      setEmail('');
      setPassword('');
      setTab('browse');
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  const handlePostDonation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tables/donations/records', {
        item_name: itemName,
        category,
        quantity,
        expiry_date: expiryDate,
        pickup_location: pickupLocation,
        status: 'available',
        donor_id: user.id,
        donor_name: user.name
      });

      setItemName('');
      setCategory('produce');
      setQuantity('');
      setExpiryDate('');
      setPickupLocation('');
      alert('Food shared successfully!');
      fetchDonations();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h1>🍕 FoodShare</h1>
        <p>Share food with your community</p>
        <div className="tabs">
          <button onClick={() => setTab('signup')} className={tab === 'signup' ? 'active' : ''}>Sign Up</button>
          <button onClick={() => setTab('login')} className={tab === 'login' ? 'active' : ''}>Log In</button>
        </div>

        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <h2>Create Account</h2>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Sign Up</button>
          </form>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <h2>Log In</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Log In</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>🍕 FoodShare</h1>
      <p>Welcome, {user.name}!</p>
      <button onClick={() => setUser(null)} className="logout">Log Out</button>
      
      <div className="tabs">
        <button onClick={() => setTab('browse')} className={tab === 'browse' ? 'active' : ''}>Browse Food</button>
        <button onClick={() => setTab('donate')} className={tab === 'donate' ? 'active' : ''}>Share Food</button>
      </div>

      {tab === 'browse' && (
        <div>
          <h2>Available Food in Your Area</h2>
          {donations.length === 0 ? (
            <p>No food available yet</p>
          ) : (
            <div className="donation-list">
              {donations.map(d => (
                <div key={d.Id} className="donation-card">
                  <h3>{d.item_name}</h3>
                  <p><strong>Category:</strong> {d.category}</p>
                  <p><strong>Quantity:</strong> {d.quantity}</p>
                  <p><strong>Expires:</strong> {new Date(d.expiry_date).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> {d.pickup_location}</p>
                  <p><strong>Posted by:</strong> {d.donor_name}</p>
                  <p className="status"><strong>Status:</strong> {d.status}</p>
                  {user.id !== d.donor_id && d.status === 'available' && (
                    <button>Request Food</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'donate' && (
        <form onSubmit={handlePostDonation}>
          <h2>Share Food</h2>
          <input placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>produce</option>
            <option>dairy</option>
            <option>meat</option>
            <option>grains</option>
            <option>other</option>
          </select>
          <input placeholder="Quantity (e.g., 5 lbs)" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          <input placeholder="Pickup location" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
          <button type="submit">Share this Food</button>
        </form>
      )}
    </div>
  );
}
