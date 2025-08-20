/**
 * Webhook Service
 * 
 * Manages webhook registrations and event triggers
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');

// Path to the webhooks storage file
const WEBHOOKS_FILE = path.join(config.webhooks.directory, 'webhooks.json');

// Initialize webhooks file if it doesn't exist
if (!fs.existsSync(WEBHOOKS_FILE)) {
  fs.writeJsonSync(WEBHOOKS_FILE, []);
}

/**
 * Register a new webhook
 */
async function registerWebhook(req, res) {
  try {
    const { url, events, description, secret } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'At least one event is required' });
    }
    
    // Validate events
    const invalidEvents = events.filter(event => !config.webhooks.events.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ 
        error: `Invalid events: ${invalidEvents.join(', ')}`,
        validEvents: config.webhooks.events
      });
    }
    
    // Load existing webhooks
    const webhooks = await loadWebhooks();
    
    // Check if webhook with the same URL already exists
    const existingWebhook = webhooks.find(webhook => webhook.url === url);
    if (existingWebhook) {
      return res.status(409).json({ 
        error: 'Webhook with this URL already exists',
        webhookId: existingWebhook.id
      });
    }
    
    // Create new webhook
    const newWebhook = {
      id: crypto.randomUUID(),
      url,
      events,
      description: description || '',
      secret: secret || '',
      createdAt: new Date().toISOString(),
      lastTriggered: null
    };
    
    // Add to webhooks list
    webhooks.push(newWebhook);
    
    // Save webhooks
    await saveWebhooks(webhooks);
    
    res.status(201).json({
      success: true,
      webhook: {
        id: newWebhook.id,
        url: newWebhook.url,
        events: newWebhook.events,
        description: newWebhook.description,
        createdAt: newWebhook.createdAt
      }
    });
  } catch (error) {
    console.error('Webhook registration error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * List registered webhooks
 */
async function listWebhooks(req, res) {
  try {
    const webhooks = await loadWebhooks();
    
    // Format response to exclude secrets
    const formattedWebhooks = webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      description: webhook.description,
      createdAt: webhook.createdAt,
      lastTriggered: webhook.lastTriggered
    }));
    
    res.json({
      success: true,
      count: formattedWebhooks.length,
      webhooks: formattedWebhooks
    });
  } catch (error) {
    console.error('Webhook listing error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Trigger a webhook event
 */
async function triggerWebhook(req, res) {
  try {
    const { event } = req.params;
    const payload = req.body;
    
    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }
    
    if (!config.webhooks.events.includes(event)) {
      return res.status(400).json({ 
        error: `Invalid event: ${event}`,
        validEvents: config.webhooks.events
      });
    }
    
    // Load webhooks
    const webhooks = await loadWebhooks();
    
    // Find webhooks subscribed to this event
    const matchingWebhooks = webhooks.filter(webhook => webhook.events.includes(event));
    
    if (matchingWebhooks.length === 0) {
      return res.json({
        success: true,
        message: `No webhooks registered for event: ${event}`,
        triggered: 0
      });
    }
    
    // Prepare the event payload
    const eventPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload || {}
    };
    
    // Trigger each webhook
    const results = await Promise.allSettled(
      matchingWebhooks.map(async webhook => {
        try {
          // Add signature if secret is provided
          const headers = {};
          if (webhook.secret) {
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(eventPayload))
              .digest('hex');
            
            headers['X-Webhook-Signature'] = signature;
          }
          
          headers['Content-Type'] = 'application/json';
          headers['X-Webhook-Event'] = event;
          
          // Send the webhook
          const response = await axios.post(webhook.url, eventPayload, { headers });
          
          // Update last triggered timestamp
          webhook.lastTriggered = new Date().toISOString();
          
          return {
            webhookId: webhook.id,
            url: webhook.url,
            status: response.status,
            success: true
          };
        } catch (error) {
          return {
            webhookId: webhook.id,
            url: webhook.url,
            status: error.response?.status || 0,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    // Save updated webhooks
    await saveWebhooks(webhooks);
    
    // Format results
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    
    res.json({
      success: true,
      event,
      triggered: matchingWebhooks.length,
      successful: successCount,
      results: results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: result.reason.message
          };
        }
      })
    });
  } catch (error) {
    console.error('Webhook trigger error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Delete a webhook
 */
async function deleteWebhook(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }
    
    // Load webhooks
    const webhooks = await loadWebhooks();
    
    // Find webhook index
    const webhookIndex = webhooks.findIndex(webhook => webhook.id === id);
    
    if (webhookIndex === -1) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    // Remove webhook
    webhooks.splice(webhookIndex, 1);
    
    // Save webhooks
    await saveWebhooks(webhooks);
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully',
      id
    });
  } catch (error) {
    console.error('Webhook deletion error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Helper function to load webhooks from file
 */
async function loadWebhooks() {
  try {
    return await fs.readJson(WEBHOOKS_FILE);
  } catch (error) {
    console.error('Error loading webhooks:', error);
    return [];
  }
}

/**
 * Helper function to save webhooks to file
 */
async function saveWebhooks(webhooks) {
  try {
    await fs.writeJson(WEBHOOKS_FILE, webhooks, { spaces: 2 });
  } catch (error) {
    console.error('Error saving webhooks:', error);
    throw error;
  }
}

module.exports = {
  registerWebhook,
  listWebhooks,
  triggerWebhook,
  deleteWebhook
};