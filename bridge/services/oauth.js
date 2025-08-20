/**
 * OAuth Service
 * 
 * Handles OAuth authentication with third-party providers
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');

// Path to the OAuth tokens storage file
const TOKENS_FILE = path.join(config.webhooks.directory, 'oauth_tokens.json');

// Initialize tokens file if it doesn't exist
if (!fs.existsSync(TOKENS_FILE)) {
  fs.writeJsonSync(TOKENS_FILE, {});
}

/**
 * Start OAuth authorization flow
 */
async function authorize(req, res) {
  try {
    const { provider } = req.params;
    
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }
    
    // Check if provider is supported
    if (!config.oauth.providers[provider]) {
      return res.status(400).json({ 
        error: `Unsupported OAuth provider: ${provider}`,
        supportedProviders: Object.keys(config.oauth.providers)
      });
    }
    
    const providerConfig = config.oauth.providers[provider];
    
    // Generate state parameter to prevent CSRF
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session
    req.session = req.session || {};
    req.session.oauthState = state;
    
    // Build authorization URL
    let authUrl;
    
    switch (provider) {
      case 'google':
        authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        authUrl += `?client_id=${encodeURIComponent(providerConfig.clientId)}`;
        authUrl += `&redirect_uri=${encodeURIComponent(providerConfig.redirectUri)}`;
        authUrl += '&response_type=code';
        authUrl += '&scope=profile email';
        authUrl += `&state=${encodeURIComponent(state)}`;
        break;
        
      // Add other providers as needed
        
      default:
        return res.status(400).json({ error: `Provider ${provider} is not implemented yet` });
    }
    
    // Redirect to authorization URL
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth authorization error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Handle OAuth callback
 */
async function callback(req, res) {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;
    
    // Check for OAuth errors
    if (error) {
      return res.status(400).json({ 
        error: 'OAuth error',
        details: error
      });
    }
    
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }
    
    // Check if provider is supported
    if (!config.oauth.providers[provider]) {
      return res.status(400).json({ 
        error: `Unsupported OAuth provider: ${provider}`,
        supportedProviders: Object.keys(config.oauth.providers)
      });
    }
    
    // Verify state parameter to prevent CSRF
    if (!req.session || req.session.oauthState !== state) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Clear state from session
    delete req.session.oauthState;
    
    const providerConfig = config.oauth.providers[provider];
    
    // Exchange authorization code for tokens
    let tokenResponse;
    
    switch (provider) {
      case 'google':
        // In a real implementation, this would make an actual API call
        // For demo purposes, we'll simulate a successful response
        if (process.env.NODE_ENV === 'production' && providerConfig.clientId !== 'demo-google-client-id') {
          tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            redirect_uri: providerConfig.redirectUri,
            grant_type: 'authorization_code'
          });
        } else {
          // Mock response for demo
          tokenResponse = {
            data: {
              access_token: `mock-access-token-${crypto.randomBytes(8).toString('hex')}`,
              refresh_token: `mock-refresh-token-${crypto.randomBytes(8).toString('hex')}`,
              expires_in: 3600,
              token_type: 'Bearer'
            }
          };
        }
        break;
        
      // Add other providers as needed
        
      default:
        return res.status(400).json({ error: `Provider ${provider} is not implemented yet` });
    }
    
    // Store tokens
    const tokens = await loadTokens();
    tokens[provider] = {
      ...tokenResponse.data,
      obtained_at: new Date().toISOString()
    };
    await saveTokens(tokens);
    
    // Redirect to success page or return tokens
    res.json({
      success: true,
      provider,
      message: 'OAuth authentication successful',
      expires_in: tokenResponse.data.expires_in
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Get OAuth connection status
 */
async function status(req, res) {
  try {
    const tokens = await loadTokens();
    
    // Format response to exclude sensitive token data
    const connections = {};
    
    for (const [provider, token] of Object.entries(tokens)) {
      connections[provider] = {
        connected: true,
        obtained_at: token.obtained_at,
        expires_in: token.expires_in
      };
    }
    
    res.json({
      success: true,
      connections
    });
  } catch (error) {
    console.error('OAuth status error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Helper function to load OAuth tokens from file
 */
async function loadTokens() {
  try {
    return await fs.readJson(TOKENS_FILE);
  } catch (error) {
    console.error('Error loading OAuth tokens:', error);
    return {};
  }
}

/**
 * Helper function to save OAuth tokens to file
 */
async function saveTokens(tokens) {
  try {
    await fs.writeJson(TOKENS_FILE, tokens, { spaces: 2 });
  } catch (error) {
    console.error('Error saving OAuth tokens:', error);
    throw error;
  }
}

module.exports = {
  authorize,
  callback,
  status
};