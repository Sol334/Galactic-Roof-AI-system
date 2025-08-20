/**
 * Galactic Roof AI System - Server
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes and middleware
const authRoutes = require('./routes/auth');
const bridgeRoutes = require('./bridge');
const { authenticateToken, checkRole } = require('./middleware/auth');

// Import analytics module
const analytics = require('./analytics');

// Register analytics routes
app.use('/api/analytics', analytics.router);

// Initialize express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to database
const db = new sqlite3.Database(path.join(__dirname, 'database/galacticroof.db'));

// Register authentication routes
app.use('/api/auth', authRoutes);

// Register bridge routes (protected by authentication)
app.use('/api/bridge', authenticateToken, bridgeRoutes);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Customer routes (protected)
app.get('/api/customers', authenticateToken, (req, res) => {
  db.all('SELECT * FROM customers', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/customers/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/customers', authenticateToken, checkRole(['admin', 'manager']), (req, res) => {
  const { name, email, phone, address, city, state, zip, notes } = req.body;
  
  db.run(
    'INSERT INTO customers (name, email, phone, address, city, state, zip, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, email, phone, address, city, state, zip, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        id: this.lastID,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        notes
      });
    }
  );
});

// Property routes (protected)
app.get('/api/properties', authenticateToken, (req, res) => {
  db.all('SELECT * FROM properties', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/properties/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM properties WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    res.json(row);
  });
});

// Lead routes (protected)
app.get('/api/leads', authenticateToken, (req, res) => {
  db.all('SELECT * FROM leads', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Project routes (protected)
app.get('/api/projects', authenticateToken, (req, res) => {
  db.all('SELECT * FROM projects', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Weather routes (protected)
app.get('/api/weather/events', authenticateToken, (req, res) => {
  db.all('SELECT * FROM weather_events', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Dashboard data (protected)
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const dashboardData = {};
  
  // Get active leads count
  db.get('SELECT COUNT(*) as count FROM leads WHERE status = "New" OR status = "Active" OR status IS NULL', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    dashboardData.activeLeadsCount = row.count;
    
    // Get recent weather events
    db.all('SELECT * FROM weather_events ORDER BY event_date DESC LIMIT 3', (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      dashboardData.recentWeatherEvents = rows;
      
      // Get projects in progress
      db.all('SELECT * FROM projects WHERE status = "In Progress" LIMIT 5', (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        dashboardData.projectsInProgress = rows;
        
        // Return all dashboard data
        res.json(dashboardData);
      });
    });
  });
});

// SuperNinja Bridge status (protected)
app.get('/api/bridge/status', authenticateToken, (req, res) => {
  // Check if SuperNinja Bridge is running
  const bridgeUrl = 'http://localhost:3456/api/health';
  
  const axios = require('axios');
  axios.get(bridgeUrl, { 
    headers: { 'Authorization': 'Bearer placeholder-token' },
    timeout: 1000
  })
    .then(() => {
      res.json({ 
        connected: true,
        message: 'SuperNinja Bridge is running'
      });
    })
    .catch(() => {
      res.json({ 
        connected: false,
        message: 'SuperNinja Bridge is not running or not accessible'
      });
    });
});

// Serve the login page for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Galactic Roof AI System running at http://localhost:${PORT}`);
});