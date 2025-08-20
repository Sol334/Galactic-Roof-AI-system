const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcrypt');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create or open the database
const db = new sqlite3.Database(path.join(dbDir, 'galacticroof.db'));

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);

  // Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Customers table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Properties table
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      zip TEXT,
      property_type TEXT,
      roof_type TEXT,
      roof_age INTEGER,
      square_footage REAL,
      stories INTEGER,
      lat REAL,
      lng REAL,
      notes TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
  `);

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      property_id INTEGER,
      project_type TEXT,
      status TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      contract_amount REAL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (property_id) REFERENCES properties (id)
    )
  `);

  // Leads table
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      source TEXT,
      service_interest TEXT,
      status TEXT,
      score REAL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Weather events table
  db.run(`
    CREATE TABLE IF NOT EXISTS weather_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      severity REAL,
      lat REAL,
      lng REAL,
      city TEXT,
      state TEXT,
      zip TEXT,
      event_date TIMESTAMP,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert some sample data
  db.run(`INSERT INTO customers (name, email, phone, address, city, state, zip, notes) 
          VALUES ('John Smith', 'john@example.com', '555-123-4567', '123 Main St', 'Springfield', 'IL', '62701', 'Interested in roof replacement')
  `);
  
  db.run(`INSERT INTO customers (name, email, phone, address, city, state, zip, notes) 
          VALUES ('Jane Doe', 'jane@example.com', '555-987-6543', '456 Oak Ave', 'Springfield', 'IL', '62702', 'Needs roof repair after storm')
  `);

  db.run(`INSERT INTO properties (customer_id, address, city, state, zip, property_type, roof_type, roof_age, square_footage, stories)
          VALUES (1, '123 Main St', 'Springfield', 'IL', '62701', 'Residential', 'Asphalt Shingle', 15, 2000, 2)
  `);

  db.run(`INSERT INTO properties (customer_id, address, city, state, zip, property_type, roof_type, roof_age, square_footage, stories)
          VALUES (2, '456 Oak Ave', 'Springfield', 'IL', '62702', 'Residential', 'Metal', 5, 1800, 1)
  `);

  db.run(`INSERT INTO projects (customer_id, property_id, project_type, status, start_date, contract_amount)
          VALUES (1, 1, 'Roof Replacement', 'In Progress', '2025-08-01', 12500)
  `);

  db.run(`INSERT INTO leads (name, email, phone, address, city, state, zip, source, service_interest, status, score)
          VALUES ('Michael Johnson', 'michael@example.com', '555-555-5555', '789 Pine St', 'Springfield', 'IL', '62703', 'Website', 'Roof Inspection', 'New', 85)
  `);

  db.run(`INSERT INTO weather_events (event_type, severity, lat, lng, city, state, zip, event_date, description)
          VALUES ('Hail Storm', 4.2, 39.78, -89.65, 'Springfield', 'IL', '62701', '2025-07-15', 'Large hail reported in the area')
  `);

  // Create default admin user
  const createAdminUser = async () => {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);
    
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('Error checking for admin user:', err);
        return;
      }
      
      if (!row) {
        db.run(
          'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
          ['admin', 'admin@galacticroof.com', passwordHash, 'admin'],
          function(err) {
            if (err) {
              console.error('Error creating admin user:', err);
              return;
            }
            console.log('Default admin user created');
          }
        );
      }
    });
  };

  createAdminUser().then(() => {
    console.log('Database initialized successfully with sample data');
  });
});

// Initialize the bridge
const initializeBridge = require('../bridge/init');

// Close the database connection after initialization and initialize bridge
setTimeout(async () => {
  db.close();
  
  try {
    await initializeBridge();
    console.log('Bridge initialization completed');
  } catch (error) {
    console.error('Bridge initialization failed:', error);
  }
}, 1000);