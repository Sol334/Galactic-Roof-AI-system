/**
 * Galactic Roof AI System - Main Application
 */

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// Check authentication on app load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = localStorage.getItem('auth_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  
  // Display user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement && user) {
    userInfoElement.textContent = `${user.username} (${user.role})`;
  }
  
  // Set up logout button
  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }
  
  // Load dashboard by default
  document.querySelector('[data-view="dashboard"]').click();
});

// Navigation
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const viewName = button.getAttribute('data-view');
    
    // Update active button
    navButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Show selected view
    views.forEach(view => {
      if (view.id === `${viewName}-view`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });
    
    // Load view data
    loadViewData(viewName);
  });
});

// API functions with authentication
async function fetchAPI(endpoint) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      // Unauthorized or forbidden - redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

async function postAPI(endpoint, data) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.status === 401 || response.status === 403) {
      // Unauthorized or forbidden - redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    return null;
  }
}

// View data loading
async function loadViewData(viewName) {
  switch (viewName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'customers':
      loadCustomers();
      break;
    case 'properties':
      loadProperties();
      break;
    case 'leads':
      loadLeads();
      break;
    case 'weather':
      loadWeather();
      break;
    case 'projects':
      loadProjects();
      break;
    case 'bridge':
      // Bridge view is initialized in bridge.js
      break;
    case 'settings':
      loadSettings();
      break;
    case 'users':
      loadUsers();
      break;
  }
}

// Dashboard
async function loadDashboard() {
  const dashboardData = await fetchAPI('dashboard');
  
  if (dashboardData) {
    // Update active leads count
    document.getElementById('active-leads-count').textContent = dashboardData.activeLeadsCount || 0;
    
    // Update weather events
    const weatherEventsElement = document.getElementById('weather-events');
    if (dashboardData.recentWeatherEvents && dashboardData.recentWeatherEvents.length > 0) {
      weatherEventsElement.innerHTML = dashboardData.recentWeatherEvents.map(event => `
        <div class="weather-event">
          <strong>${event.event_type}</strong> (${new Date(event.event_date).toLocaleDateString()})
          <p>${event.description}</p>
        </div>
      `).join('');
    } else {
      weatherEventsElement.textContent = 'No recent weather events';
    }
    
    // Update projects
    const projectsElement = document.getElementById('projects-in-progress');
    if (dashboardData.projectsInProgress && dashboardData.projectsInProgress.length > 0) {
      projectsElement.innerHTML = dashboardData.projectsInProgress.map(project => `
        <div class="project-item">
          <strong>${project.project_type}</strong> - $${project.contract_amount}
          <p>Status: ${project.status}</p>
        </div>
      `).join('');
    } else {
      projectsElement.textContent = 'No projects in progress';
    }
  }
  
  // Check bridge status
  const bridgeStatus = await fetchAPI('bridge/status');
  if (bridgeStatus) {
    const bridgeStatusElement = document.getElementById('bridge-status');
    bridgeStatusElement.textContent = bridgeStatus.message;
    bridgeStatusElement.className = bridgeStatus.connected ? 'connected' : 'disconnected';
  }
}

// Customers
async function loadCustomers() {
  const customers = await fetchAPI('customers');
  const tableBody = document.getElementById('customers-table-body');
  
  if (!customers || customers.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No customers found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = customers.map(customer => `
    <tr>
      <td>${customer.name}</td>
      <td>${customer.phone || ''}</td>
      <td>${customer.email || ''}</td>
      <td>${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zip || ''}</td>
      <td>
        <button class="btn" onclick="viewCustomer(${customer.id})">View</button>
        <button class="btn btn-secondary" onclick="editCustomer(${customer.id})">Edit</button>
      </td>
    </tr>
  `).join('');
}

// Properties
async function loadProperties() {
  const properties = await fetchAPI('properties');
  const tableBody = document.getElementById('properties-table-body');
  
  if (!properties || properties.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No properties found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = properties.map(property => `
    <tr>
      <td>${property.address}</td>
      <td>${property.city || ''}, ${property.state || ''} ${property.zip || ''}</td>
      <td>${property.property_type || 'Unknown'}</td>
      <td>${property.roof_type || 'Unknown'}</td>
      <td>${property.roof_age || 'Unknown'} years</td>
      <td>
        <button class="btn" onclick="viewProperty(${property.id})">View</button>
        <button class="btn btn-secondary" onclick="editProperty(${property.id})">Edit</button>
      </td>
    </tr>
  `).join('');
}

// Leads
async function loadLeads() {
  const leads = await fetchAPI('leads');
  const tableBody = document.getElementById('leads-table-body');
  
  if (!leads || leads.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No leads found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = leads.map(lead => `
    <tr>
      <td>${lead.name}</td>
      <td>${lead.phone || ''}<br>${lead.email || ''}</td>
      <td>${lead.source || 'Unknown'}</td>
      <td>${lead.service_interest || 'Unknown'}</td>
      <td>${lead.status || 'New'}</td>
      <td>${lead.score || 'N/A'}</td>
    </tr>
  `).join('');
}

// Weather
async function loadWeather() {
  const weatherEvents = await fetchAPI('weather/events');
  const tableBody = document.getElementById('weather-table-body');
  
  if (!weatherEvents || weatherEvents.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No weather events found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = weatherEvents.map(event => `
    <tr>
      <td>${new Date(event.event_date).toLocaleDateString()}</td>
      <td>${event.city || ''}, ${event.state || ''}</td>
      <td>${event.event_type}</td>
      <td>${event.severity}</td>
      <td>${event.description}</td>
    </tr>
  `).join('');
}

// Projects
async function loadProjects() {
  const projects = await fetchAPI('projects');
  const tableBody = document.getElementById('projects-table-body');
  
  if (!projects || projects.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No projects found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = projects.map(project => `
    <tr>
      <td>${project.customer_id}</td>
      <td>${project.property_id}</td>
      <td>${project.project_type || 'Unknown'}</td>
      <td>${project.status || 'New'}</td>
      <td>${project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not started'}</td>
      <td>$${project.contract_amount || '0'}</td>
    </tr>
  `).join('');
}

// Users (Admin only)
async function loadUsers() {
  const users = await fetchAPI('auth/users');
  const tableBody = document.getElementById('users-table-body');
  
  if (!users || users.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No users found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
      <td>
        <button class="btn btn-secondary" onclick="editUser(${user.id})">Edit</button>
      </td>
    </tr>
  `).join('');
}

// Settings
async function loadSettings() {
  const bridgeStatus = await fetchAPI('bridge/status');
  
  if (bridgeStatus) {
    const statusElement = document.getElementById('bridge-status-settings');
    statusElement.textContent = bridgeStatus.message;
    statusElement.className = bridgeStatus.connected ? 'connected' : 'disconnected';
  }
  
  // Check if user is admin to show admin settings
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminSettingsElement = document.getElementById('admin-settings');
  
  if (adminSettingsElement) {
    if (user.role === 'admin') {
      adminSettingsElement.style.display = 'block';
    } else {
      adminSettingsElement.style.display = 'none';
    }
  }
}

// Customer functions
function viewCustomer(id) {
  alert(`View customer ${id}`);
}

function editCustomer(id) {
  alert(`Edit customer ${id}`);
}

// Property functions
function viewProperty(id) {
  alert(`View property ${id}`);
}

function editProperty(id) {
  alert(`Edit property ${id}`);
}

// User functions
function editUser(id) {
  alert(`Edit user ${id}`);
}

// Connect to SuperNinja Bridge
document.getElementById('connect-bridge-btn').addEventListener('click', async () => {
  const token = document.getElementById('bridge-token').value.trim();
  
  if (!token) {
    alert('Please enter a bridge token');
    return;
  }
  
  // In a real implementation, we would store the token and use it for API calls
  alert(`Bridge token saved: ${token}`);
  
  // Refresh bridge status
  loadSettings();
});