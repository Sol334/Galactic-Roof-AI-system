/**
 * Galactic Roof AI - Cloudflare Worker
 * 
 * This worker handles API requests and connects to Cloudflare D1 database
 * and R2 storage for the Galactic Roof AI system.
 */

// Define routes
const routes = {
  // Auth routes
  'POST /api/auth/login': handleLogin,
  'POST /api/auth/register': handleRegister,
  'GET /api/auth/me': handleGetCurrentUser,
  'GET /api/auth/users': handleGetUsers,
  
  // Customer routes
  'GET /api/customers': handleGetCustomers,
  'GET /api/customers/:id': handleGetCustomer,
  'POST /api/customers': handleCreateCustomer,
  'PUT /api/customers/:id': handleUpdateCustomer,
  'DELETE /api/customers/:id': handleDeleteCustomer,
  
  // Property routes
  'GET /api/properties': handleGetProperties,
  'GET /api/properties/:id': handleGetProperty,
  'POST /api/properties': handleCreateProperty,
  'PUT /api/properties/:id': handleUpdateProperty,
  'DELETE /api/properties/:id': handleDeleteProperty,
  
  // Lead routes
  'GET /api/leads': handleGetLeads,
  'POST /api/leads': handleCreateLead,
  'PUT /api/leads/:id': handleUpdateLead,
  
  // Project routes
  'GET /api/projects': handleGetProjects,
  'POST /api/projects': handleCreateProject,
  'PUT /api/projects/:id': handleUpdateProject,
  
  // Weather routes
  'GET /api/weather/events': handleGetWeatherEvents,
  'POST /api/weather/events': handleCreateWeatherEvent,
  
  // Dashboard data
  'GET /api/dashboard': handleGetDashboard,
  
  // Bridge routes
  'GET /api/bridge/status': handleBridgeStatus,
  'GET /api/bridge/weather/current': handleWeatherCurrent,
  'GET /api/bridge/weather/forecast': handleWeatherForecast,
  'POST /api/bridge/files/upload': handleFileUpload,
  'GET /api/bridge/files/list': handleFilesList,
  'GET /api/bridge/files/download/:filename': handleFileDownload,
  'POST /api/bridge/webhooks/register': handleWebhookRegister,
  'GET /api/bridge/webhooks/list': handleWebhooksList,
  'POST /api/bridge/webhooks/trigger/:event': handleWebhookTrigger,
  
  // Health check
  'GET /api/health': handleHealthCheck
};

// Main request handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }
    
    // Parse request URL
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Check if this is an API request
    if (!path.startsWith('/api/')) {
      // Not an API request, pass through to Pages
      return fetch(request);
    }
    
    // Find matching route
    const route = findRoute(request.method, path);
    if (!route) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders()
      });
    }
    
    // Extract route params
    const params = extractParams(route.pattern, path);
    
    try {
      // Verify authentication for protected routes
      if (route.requiresAuth !== false) {
        const user = await authenticateRequest(request, env);
        if (!user) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        
        // Add user to request
        request.user = user;
      }
      
      // Call route handler
      return await route.handler(request, env, params);
    } catch (error) {
      console.error('Error handling request:', error);
      
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), {
        status: error.status || 500,
        headers: corsHeaders()
      });
    }
  }
};

// Find matching route
function findRoute(method, path) {
  const routeKey = Object.keys(routes).find(key => {
    const [routeMethod, routePath] = key.split(' ');
    return routeMethod === method && matchPath(routePath, path);
  });
  
  if (!routeKey) return null;
  
  const [_, routePath] = routeKey.split(' ');
  const handler = routes[routeKey];
  
  return {
    pattern: routePath,
    handler,
    requiresAuth: !routePath.startsWith('/api/auth/login') && 
                  !routePath.startsWith('/api/auth/register') &&
                  !routePath.startsWith('/api/health')
  };
}

// Match path pattern
function matchPath(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      // This is a parameter, it matches anything
      continue;
    }
    
    if (patternParts[i] !== pathParts[i]) {
      return false;
    }
  }
  
  return true;
}

// Extract params from path
function extractParams(pattern, path) {
  const params = {};
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].substring(1);
      params[paramName] = pathParts[i];
    }
  }
  
  return params;
}

// CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

// Handle CORS preflight
function handleCors(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

// Authenticate request
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // In a real implementation, this would verify the JWT token
    // For now, we'll use a simple verification
    const { JWT_SECRET } = env;
    
    // This is a placeholder for actual JWT verification
    // In production, use a proper JWT library
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Handler functions

// Auth handlers
async function handleLogin(request, env) {
  const { username, password } = await request.json();
  
  // Validate input
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password are required' }), {
      status: 400,
      headers: corsHeaders()
    });
  }
  
  try {
    // Query the database
    const user = await env.DATABASE.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: corsHeaders()
      });
    }
    
    // In a real implementation, this would use bcrypt to compare passwords
    // For now, we'll use a simple comparison (NOT SECURE for production)
    // const passwordMatch = await bcrypt.compare(password, user.password_hash);
    const passwordMatch = password === 'admin123' && username === 'admin'; // Demo only
    
    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: corsHeaders()
      });
    }
    
    // Generate JWT token
    const token = generateToken(user, env.JWT_SECRET);
    
    // Update last login time
    await env.DATABASE.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    return new Response(JSON.stringify({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleRegister(request, env) {
  const { username, email, password, role = 'user' } = await request.json();
  
  // Validate input
  if (!username || !email || !password) {
    return new Response(JSON.stringify({ error: 'Username, email, and password are required' }), {
      status: 400,
      headers: corsHeaders()
    });
  }
  
  try {
    // Check if user already exists
    const existingUser = await env.DATABASE.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
        status: 409,
        headers: corsHeaders()
      });
    }
    
    // In a real implementation, this would use bcrypt to hash the password
    // For now, we'll use a simple hash (NOT SECURE for production)
    // const passwordHash = await bcrypt.hash(password, 10);
    const passwordHash = `hashed_${password}`; // Demo only
    
    // Insert new user
    const result = await env.DATABASE.prepare(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).bind(username, email, passwordHash, role).run();
    
    return new Response(JSON.stringify({
      id: result.lastRowId,
      username,
      email,
      role
    }), {
      status: 201,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleGetCurrentUser(request, env) {
  const user = request.user;
  
  try {
    // Get user details from database
    const userDetails = await env.DATABASE.prepare(
      'SELECT id, username, email, role FROM users WHERE id = ?'
    ).bind(user.id).first();
    
    if (!userDetails) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: corsHeaders()
      });
    }
    
    return new Response(JSON.stringify(userDetails), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user details' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleGetUsers(request, env) {
  const user = request.user;
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
      status: 403,
      headers: corsHeaders()
    });
  }
  
  try {
    // Get all users
    const users = await env.DATABASE.prepare(
      'SELECT id, username, email, role, created_at, last_login FROM users'
    ).all();
    
    return new Response(JSON.stringify(users.results), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Get users error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get users' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Customer handlers
async function handleGetCustomers(request, env) {
  try {
    // Get all customers
    const customers = await env.DATABASE.prepare(
      'SELECT * FROM customers'
    ).all();
    
    return new Response(JSON.stringify(customers.results), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get customers' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleGetCustomer(request, env, params) {
  const { id } = params;
  
  try {
    // Get customer by ID
    const customer = await env.DATABASE.prepare(
      'SELECT * FROM customers WHERE id = ?'
    ).bind(id).first();
    
    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: corsHeaders()
      });
    }
    
    return new Response(JSON.stringify(customer), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get customer' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleCreateCustomer(request, env) {
  const { name, email, phone, address, city, state, zip, notes } = await request.json();
  
  // Validate input
  if (!name) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: corsHeaders()
    });
  }
  
  try {
    // Insert new customer
    const result = await env.DATABASE.prepare(
      'INSERT INTO customers (name, email, phone, address, city, state, zip, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, email, phone, address, city, state, zip, notes).run();
    
    return new Response(JSON.stringify({
      id: result.lastRowId,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      notes
    }), {
      status: 201,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleUpdateCustomer(request, env, params) {
  const { id } = params;
  const { name, email, phone, address, city, state, zip, notes } = await request.json();
  
  // Validate input
  if (!name) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: corsHeaders()
    });
  }
  
  try {
    // Update customer
    await env.DATABASE.prepare(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?, notes = ? WHERE id = ?'
    ).bind(name, email, phone, address, city, state, zip, notes, id).run();
    
    return new Response(JSON.stringify({
      id: parseInt(id),
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      notes
    }), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Update customer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update customer' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function handleDeleteCustomer(request, env, params) {
  const { id } = params;
  
  try {
    // Delete customer
    await env.DATABASE.prepare(
      'DELETE FROM customers WHERE id = ?'
    ).bind(id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Customer deleted successfully'
    }), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete customer' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Property handlers
async function handleGetProperties(request, env) {
  try {
    // Get all properties
    const properties = await env.DATABASE.prepare(
      'SELECT * FROM properties'
    ).all();
    
    return new Response(JSON.stringify(properties.results), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Get properties error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get properties' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Implement other handlers similarly...

// Health check handler
async function handleHealthCheck(request, env) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString()
  }), {
    headers: corsHeaders()
  });
}

// Bridge status handler
async function handleBridgeStatus(request, env) {
  return new Response(JSON.stringify({
    connected: true,
    message: 'Bridge is active',
    services: {
      weather: true,
      files: true,
      webhooks: true,
      oauth: true
    }
  }), {
    headers: corsHeaders()
  });
}

// Helper function to generate JWT token
function generateToken(user, secret) {
  // In a real implementation, this would use a JWT library
  // For now, we'll create a simple token
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  
  // In a real implementation, this would use a proper signature
  // This is just for demonstration
  const signature = btoa(`${base64Header}.${base64Payload}.${secret}`);
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

// Implement remaining handlers as needed...