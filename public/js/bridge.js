/**
 * Galactic Roof AI - Bridge Interface
 * 
 * This file provides the frontend interface for interacting with the bridge services
 */

// Bridge API client
class BridgeClient {
  constructor() {
    this.baseUrl = '/api/bridge';
    this.token = localStorage.getItem('auth_token');
  }
  
  // Helper method for API requests
  async request(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      };
      
      const options = {
        method,
        headers
      };
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Bridge API error (${endpoint}):`, error);
      throw error;
    }
  }
  
  // Get bridge status
  async getStatus() {
    return this.request('/status');
  }
  
  // Weather services
  async getCurrentWeather(location) {
    return this.request(`/weather/current?location=${encodeURIComponent(location)}`);
  }
  
  async getWeatherForecast(location, days = 3) {
    return this.request(`/weather/forecast?location=${encodeURIComponent(location)}&days=${days}`);
  }
  
  async getWeatherAlerts(location) {
    return this.request(`/weather/alerts?location=${encodeURIComponent(location)}`);
  }
  
  // File services
  async uploadFiles(formData) {
    try {
      const url = `${this.baseUrl}/files/upload`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });
      
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
  
  async listFiles(folder = '', type = '') {
    let url = '/files/list';
    const params = [];
    
    if (folder) params.push(`folder=${encodeURIComponent(folder)}`);
    if (type) params.push(`type=${encodeURIComponent(type)}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.request(url);
  }
  
  // Webhook services
  async listWebhooks() {
    return this.request('/webhooks/list');
  }
  
  async registerWebhook(url, events, description = '', secret = '') {
    return this.request('/webhooks/register', 'POST', {
      url,
      events,
      description,
      secret
    });
  }
  
  async triggerWebhook(event, payload = {}) {
    return this.request(`/webhooks/trigger/${event}`, 'POST', payload);
  }
  
  // OAuth services
  async getOAuthStatus() {
    return this.request('/oauth/status');
  }
  
  // Helper method to get OAuth authorization URL
  getOAuthUrl(provider) {
    return `${this.baseUrl}/oauth/${provider}/authorize`;
  }
}

// Initialize bridge client
const bridge = new BridgeClient();

// Bridge UI components
document.addEventListener('DOMContentLoaded', () => {
  // Initialize bridge UI if we're on the bridge page
  const bridgeView = document.getElementById('bridge-view');
  if (bridgeView) {
    initializeBridgeUI();
  }
});

// Initialize bridge UI
async function initializeBridgeUI() {
  try {
    // Get bridge status
    const status = await bridge.getStatus();
    
    // Update status display
    const statusElement = document.getElementById('bridge-status-display');
    if (statusElement) {
      statusElement.textContent = status.status;
      statusElement.className = status.status === 'active' ? 'connected' : 'disconnected';
    }
    
    // Update services status
    const servicesElement = document.getElementById('bridge-services');
    if (servicesElement && status.services) {
      const servicesList = Object.entries(status.services).map(([service, enabled]) => `
        <div class="service-item">
          <span class="service-name">${service}</span>
          <span class="service-status ${enabled ? 'connected' : 'disconnected'}">
            ${enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      `).join('');
      
      servicesElement.innerHTML = servicesList;
    }
    
    // Initialize weather form
    const weatherForm = document.getElementById('weather-form');
    if (weatherForm) {
      weatherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const location = document.getElementById('weather-location').value;
        if (!location) return;
        
        try {
          const weatherData = await bridge.getCurrentWeather(location);
          const weatherResultElement = document.getElementById('weather-result');
          
          if (weatherResultElement && weatherData) {
            weatherResultElement.innerHTML = `
              <div class="weather-card">
                <h4>${weatherData.location.name}, ${weatherData.location.country}</h4>
                <div class="weather-info">
                  <div class="weather-temp">${weatherData.current.temp_c}°C / ${weatherData.current.temp_f}°F</div>
                  <div class="weather-condition">${weatherData.current.condition.text}</div>
                </div>
                <div class="weather-details">
                  <div>Humidity: ${weatherData.current.humidity}%</div>
                  <div>Wind: ${weatherData.current.wind_mph} mph</div>
                  <div>Precipitation: ${weatherData.current.precip_mm} mm</div>
                </div>
              </div>
            `;
          }
        } catch (error) {
          console.error('Weather fetch error:', error);
        }
      });
    }
    
    // Initialize file upload form
    const fileUploadForm = document.getElementById('file-upload-form');
    if (fileUploadForm) {
      fileUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('file-input');
        if (!fileInput.files || fileInput.files.length === 0) return;
        
        const formData = new FormData();
        for (const file of fileInput.files) {
          formData.append('files', file);
        }
        
        try {
          const uploadResult = await bridge.uploadFiles(formData);
          const uploadResultElement = document.getElementById('upload-result');
          
          if (uploadResultElement && uploadResult) {
            if (uploadResult.success) {
              uploadResultElement.innerHTML = `
                <div class="success-message">
                  ${uploadResult.message}
                </div>
                <div class="file-list">
                  ${uploadResult.files.map(file => `
                    <div class="file-item">
                      <div class="file-name">${file.originalname}</div>
                      <div class="file-size">${formatFileSize(file.size)}</div>
                      <a href="${file.url}" target="_blank" class="btn btn-sm">View</a>
                    </div>
                  `).join('')}
                </div>
              `;
            } else {
              uploadResultElement.innerHTML = `
                <div class="error-message">
                  ${uploadResult.error || 'Upload failed'}
                </div>
              `;
            }
          }
        } catch (error) {
          console.error('File upload error:', error);
        }
      });
    }
    
    // Load existing files
    await loadFilesList();
    
    // Initialize webhook UI
    await loadWebhooksList();
    
    // Initialize OAuth UI
    await loadOAuthStatus();
    
  } catch (error) {
    console.error('Bridge UI initialization error:', error);
  }
}

// Load files list
async function loadFilesList() {
  try {
    const filesListElement = document.getElementById('files-list');
    if (!filesListElement) return;
    
    const result = await bridge.listFiles();
    
    if (result.success) {
      if (result.files.length === 0) {
        filesListElement.innerHTML = '<div class="empty-message">No files uploaded yet</div>';
        return;
      }
      
      filesListElement.innerHTML = result.files.map(file => `
        <div class="file-item">
          <div class="file-name">${file.originalname || file.filename}</div>
          <div class="file-info">
            <span class="file-type">${file.mimetype}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
          </div>
          <div class="file-actions">
            <a href="${file.url}" target="_blank" class="btn btn-sm">Download</a>
          </div>
        </div>
      `).join('');
    } else {
      filesListElement.innerHTML = `<div class="error-message">${result.error || 'Failed to load files'}</div>`;
    }
  } catch (error) {
    console.error('Load files error:', error);
  }
}

// Load webhooks list
async function loadWebhooksList() {
  try {
    const webhooksListElement = document.getElementById('webhooks-list');
    if (!webhooksListElement) return;
    
    const result = await bridge.listWebhooks();
    
    if (result.success) {
      if (result.webhooks.length === 0) {
        webhooksListElement.innerHTML = '<div class="empty-message">No webhooks registered yet</div>';
        return;
      }
      
      webhooksListElement.innerHTML = result.webhooks.map(webhook => `
        <div class="webhook-item">
          <div class="webhook-url">${webhook.url}</div>
          <div class="webhook-events">
            ${webhook.events.map(event => `<span class="event-tag">${event}</span>`).join('')}
          </div>
          <div class="webhook-info">
            <div>Created: ${new Date(webhook.createdAt).toLocaleString()}</div>
            <div>Last triggered: ${webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}</div>
          </div>
        </div>
      `).join('');
    } else {
      webhooksListElement.innerHTML = `<div class="error-message">${result.error || 'Failed to load webhooks'}</div>`;
    }
  } catch (error) {
    console.error('Load webhooks error:', error);
  }
}

// Load OAuth status
async function loadOAuthStatus() {
  try {
    const oauthStatusElement = document.getElementById('oauth-status');
    if (!oauthStatusElement) return;
    
    const result = await bridge.getOAuthStatus();
    
    if (result.success) {
      const connections = result.connections;
      
      if (Object.keys(connections).length === 0) {
        oauthStatusElement.innerHTML = '<div class="empty-message">No OAuth connections</div>';
        return;
      }
      
      oauthStatusElement.innerHTML = Object.entries(connections).map(([provider, status]) => `
        <div class="oauth-item">
          <div class="oauth-provider">${provider}</div>
          <div class="oauth-status ${status.connected ? 'connected' : 'disconnected'}">
            ${status.connected ? 'Connected' : 'Disconnected'}
          </div>
          <div class="oauth-info">
            ${status.obtained_at ? `Connected on: ${new Date(status.obtained_at).toLocaleString()}` : ''}
          </div>
        </div>
      `).join('');
    } else {
      oauthStatusElement.innerHTML = `<div class="error-message">${result.error || 'Failed to load OAuth status'}</div>`;
    }
  } catch (error) {
    console.error('Load OAuth status error:', error);
  }
}

// Register webhook function
async function registerWebhook() {
  const url = document.getElementById('webhook-url').value;
  const description = document.getElementById('webhook-description').value;
  const eventCheckboxes = document.querySelectorAll('input[name="webhook-event"]:checked');
  
  if (!url) {
    alert('Please enter a webhook URL');
    return;
  }
  
  if (eventCheckboxes.length === 0) {
    alert('Please select at least one event');
    return;
  }
  
  const events = Array.from(eventCheckboxes).map(checkbox => checkbox.value);
  
  try {
    const result = await bridge.registerWebhook(url, events, description);
    
    if (result.success) {
      alert('Webhook registered successfully');
      document.getElementById('webhook-form').style.display = 'none';
      
      // Reset form
      document.getElementById('webhook-url').value = '';
      document.getElementById('webhook-description').value = '';
      eventCheckboxes.forEach(checkbox => checkbox.checked = false);
      
      // Reload webhooks list
      await loadWebhooksList();
    } else {
      alert(`Failed to register webhook: ${result.error}`);
    }
  } catch (error) {
    console.error('Webhook registration error:', error);
    alert('An error occurred while registering the webhook');
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}