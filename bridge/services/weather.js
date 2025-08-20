/**
 * Weather Service
 * 
 * Provides weather data from external weather APIs
 */

const axios = require('axios');
const config = require('../config');

// Weather API key
const API_KEY = config.apiKeys.weatherApi;
const BASE_URL = config.endpoints.weather;

/**
 * Get current weather for a location
 */
async function getCurrentWeather(req, res) {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }
    
    // In a real implementation, this would use the actual Weather API
    // For demo purposes, we'll return mock data
    if (process.env.NODE_ENV === 'production' && API_KEY !== 'demo-weather-api-key') {
      const response = await axios.get(`${BASE_URL}/current.json`, {
        params: {
          key: API_KEY,
          q: location
        }
      });
      return res.json(response.data);
    }
    
    // Return mock data
    const mockData = generateMockWeatherData(location);
    res.json(mockData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
}

/**
 * Get weather forecast for a location
 */
async function getForecast(req, res) {
  try {
    const { location, days = 3 } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }
    
    // In a real implementation, this would use the actual Weather API
    // For demo purposes, we'll return mock data
    if (process.env.NODE_ENV === 'production' && API_KEY !== 'demo-weather-api-key') {
      const response = await axios.get(`${BASE_URL}/forecast.json`, {
        params: {
          key: API_KEY,
          q: location,
          days: days
        }
      });
      return res.json(response.data);
    }
    
    // Return mock forecast data
    const mockData = generateMockForecastData(location, parseInt(days));
    res.json(mockData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
}

/**
 * Get weather alerts for a location
 */
async function getAlerts(req, res) {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }
    
    // In a real implementation, this would use the actual Weather API
    // For demo purposes, we'll return mock data
    if (process.env.NODE_ENV === 'production' && API_KEY !== 'demo-weather-api-key') {
      const response = await axios.get(`${BASE_URL}/forecast.json`, {
        params: {
          key: API_KEY,
          q: location,
          alerts: 'yes'
        }
      });
      return res.json(response.data.alerts);
    }
    
    // Return mock alert data
    const mockAlerts = generateMockAlerts(location);
    res.json(mockAlerts);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
}

/**
 * Get historical weather data for a location
 */
async function getHistory(req, res) {
  try {
    const { location, date } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }
    
    // In a real implementation, this would use the actual Weather API
    // For demo purposes, we'll return mock data
    if (process.env.NODE_ENV === 'production' && API_KEY !== 'demo-weather-api-key') {
      const response = await axios.get(`${BASE_URL}/history.json`, {
        params: {
          key: API_KEY,
          q: location,
          dt: date
        }
      });
      return res.json(response.data);
    }
    
    // Return mock historical data
    const mockData = generateMockHistoricalData(location, date);
    res.json(mockData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
}

// Helper functions to generate mock data
function generateMockWeatherData(location) {
  return {
    location: {
      name: location,
      region: 'Demo Region',
      country: 'Demo Country',
      lat: 40.7128,
      lon: -74.0060,
      localtime: new Date().toISOString()
    },
    current: {
      temp_c: Math.floor(Math.random() * 35),
      temp_f: Math.floor(Math.random() * 95),
      condition: {
        text: ['Sunny', 'Partly cloudy', 'Cloudy', 'Overcast', 'Mist', 'Rain'][Math.floor(Math.random() * 6)],
        icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
      },
      wind_mph: Math.floor(Math.random() * 20),
      wind_kph: Math.floor(Math.random() * 30),
      humidity: Math.floor(Math.random() * 100),
      cloud: Math.floor(Math.random() * 100),
      precip_mm: Math.random() * 10,
      precip_in: Math.random() * 0.5
    }
  };
}

function generateMockForecastData(location, days) {
  const forecast = {
    location: {
      name: location,
      region: 'Demo Region',
      country: 'Demo Country',
      lat: 40.7128,
      lon: -74.0060,
      localtime: new Date().toISOString()
    },
    current: generateMockWeatherData(location).current,
    forecast: {
      forecastday: []
    }
  };
  
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(today.getDate() + i);
    
    forecast.forecast.forecastday.push({
      date: forecastDate.toISOString().split('T')[0],
      day: {
        maxtemp_c: Math.floor(Math.random() * 35),
        maxtemp_f: Math.floor(Math.random() * 95),
        mintemp_c: Math.floor(Math.random() * 20),
        mintemp_f: Math.floor(Math.random() * 70),
        avgtemp_c: Math.floor(Math.random() * 30),
        avgtemp_f: Math.floor(Math.random() * 85),
        condition: {
          text: ['Sunny', 'Partly cloudy', 'Cloudy', 'Overcast', 'Rain', 'Thunderstorm'][Math.floor(Math.random() * 6)],
          icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
        },
        daily_chance_of_rain: Math.floor(Math.random() * 100),
        totalprecip_mm: Math.random() * 20,
        totalprecip_in: Math.random() * 1
      }
    });
  }
  
  return forecast;
}

function generateMockAlerts(location) {
  const alertTypes = [
    { title: 'Severe Thunderstorm Warning', desc: 'The National Weather Service has issued a Severe Thunderstorm Warning' },
    { title: 'Flash Flood Warning', desc: 'The National Weather Service has issued a Flash Flood Warning' },
    { title: 'Tornado Watch', desc: 'The National Weather Service has issued a Tornado Watch' },
    { title: 'Excessive Heat Warning', desc: 'The National Weather Service has issued an Excessive Heat Warning' },
    { title: 'Winter Storm Warning', desc: 'The National Weather Service has issued a Winter Storm Warning' }
  ];
  
  // Randomly decide if there are alerts
  const hasAlerts = Math.random() > 0.7;
  
  if (!hasAlerts) {
    return { alerts: [] };
  }
  
  // Generate 1-3 random alerts
  const numAlerts = Math.floor(Math.random() * 3) + 1;
  const alerts = [];
  
  for (let i = 0; i < numAlerts; i++) {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    alerts.push({
      headline: alertType.title,
      msgtype: 'Alert',
      severity: 'Moderate',
      urgency: 'Expected',
      areas: location,
      category: 'Met',
      certainty: 'Possible',
      event: alertType.title,
      note: 'Demo Alert',
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      desc: `${alertType.desc} for ${location} and surrounding areas.`,
      instruction: 'Take appropriate action.'
    });
  }
  
  return { alerts };
}

function generateMockHistoricalData(location, date) {
  return {
    location: {
      name: location,
      region: 'Demo Region',
      country: 'Demo Country',
      lat: 40.7128,
      lon: -74.0060,
      localtime: new Date().toISOString()
    },
    forecast: {
      forecastday: [
        {
          date,
          day: {
            maxtemp_c: Math.floor(Math.random() * 35),
            maxtemp_f: Math.floor(Math.random() * 95),
            mintemp_c: Math.floor(Math.random() * 20),
            mintemp_f: Math.floor(Math.random() * 70),
            avgtemp_c: Math.floor(Math.random() * 30),
            avgtemp_f: Math.floor(Math.random() * 85),
            condition: {
              text: ['Sunny', 'Partly cloudy', 'Cloudy', 'Overcast', 'Rain', 'Thunderstorm'][Math.floor(Math.random() * 6)],
              icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
            },
            daily_chance_of_rain: Math.floor(Math.random() * 100),
            totalprecip_mm: Math.random() * 20,
            totalprecip_in: Math.random() * 1
          }
        }
      ]
    }
  };
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getAlerts,
  getHistory
};