/**
 * Galactic Roof AI - Universal API Bridge
 * 
 * This module provides a unified interface for connecting to external services
 * and APIs, handling file uploads, and managing webhooks.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const crypto = require('crypto');
const config = require('./config');

// Create router
const router = express.Router();

// Import services
const { 
  weatherService, 
  fileService, 
  webhookService, 
  oauthService 
} = require('./services');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const uploadDir = path.join(config.uploads.directory, `${year}-${month}`);
    
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.uploads.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.uploads.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
    }
  }
});

// Bridge status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    version: '1.0.0',
    services: {
      weather: !!config.apiKeys.weatherApi,
      maps: !!config.apiKeys.googleMaps,
      sms: !!config.apiKeys.twilioSms
    },
    timestamp: new Date()
  });
});

// Weather service endpoints
router.get('/weather/current', weatherService.getCurrentWeather);
router.get('/weather/forecast', weatherService.getForecast);
router.get('/weather/alerts', weatherService.getAlerts);
router.get('/weather/history', weatherService.getHistory);

// File service endpoints
router.post('/files/upload', upload.array('files', config.uploads.maxFiles), fileService.uploadFiles);
router.get('/files/list', fileService.listFiles);
router.get('/files/download/:filename', fileService.downloadFile);
router.delete('/files/delete/:filename', fileService.deleteFile);

// Webhook endpoints
router.post('/webhooks/register', webhookService.registerWebhook);
router.get('/webhooks/list', webhookService.listWebhooks);
router.post('/webhooks/trigger/:event', webhookService.triggerWebhook);
router.delete('/webhooks/delete/:id', webhookService.deleteWebhook);

// OAuth endpoints
router.get('/oauth/:provider/authorize', oauthService.authorize);
router.get('/oauth/:provider/callback', oauthService.callback);
router.get('/oauth/status', oauthService.status);

// Generic API proxy for third-party services
router.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, data = null } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Add security check to prevent server-side request forgery
    const parsedUrl = new URL(url);
    const allowedHosts = [
      'api.weatherapi.com',
      'maps.googleapis.com',
      'api.twilio.com'
    ];
    
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return res.status(403).json({ error: 'Host not allowed' });
    }
    
    const response = await axios({
      url,
      method,
      headers,
      data
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Bridge error:', err);
  res.status(500).json({
    error: err.message,
    status: 'error'
  });
});

module.exports = router;