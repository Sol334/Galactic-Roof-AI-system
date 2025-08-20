/**
 * Galactic Roof AI - Bridge Configuration
 * 
 * This file contains the configuration for the universal API bridge
 * that connects the Galactic Roof AI system to external services.
 */

const path = require('path');
const fs = require('fs-extra');

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const webhooksDir = path.join(__dirname, 'webhooks');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(webhooksDir);

// Bridge configuration
const bridgeConfig = {
  // API keys for external services
  apiKeys: {
    weatherApi: process.env.WEATHER_API_KEY || 'demo-weather-api-key',
    googleMaps: process.env.GOOGLE_MAPS_API_KEY || 'demo-google-maps-key',
    twilioSms: process.env.TWILIO_API_KEY || 'demo-twilio-key'
  },
  
  // Service endpoints
  endpoints: {
    weather: 'https://api.weatherapi.com/v1',
    geocoding: 'https://maps.googleapis.com/maps/api/geocode',
    sms: 'https://api.twilio.com/2010-04-01'
  },
  
  // Upload configuration
  uploads: {
    directory: uploadsDir,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles: 20
  },
  
  // Webhook configuration
  webhooks: {
    directory: webhooksDir,
    events: [
      'project.created',
      'project.updated',
      'project.completed',
      'lead.created',
      'weather.alert',
      'customer.created'
    ]
  },
  
  // OAuth configuration
  oauth: {
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-google-client-secret',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/bridge/oauth/google/callback'
      }
    }
  }
};

module.exports = bridgeConfig;