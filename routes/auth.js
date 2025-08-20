/**
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken, SECRET_KEY } = require('../middleware/auth');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../database/galacticroof.db'));

/**
 * User registration
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  
  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  
  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      db.run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, role],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            username,
            email,
            role
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * User login
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Find user
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    try {
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '24h' }
      );
      
      // Update last login time
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

/**
 * Get all users (admin only)
 * GET /api/auth/users
 */
router.get('/users', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  db.all('SELECT id, username, email, role, created_at, last_login FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(users);
  });
});

module.exports = router;