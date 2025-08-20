/**
 * Bridge Initialization Script
 * 
 * This script initializes the bridge directories and configuration files
 */

const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

/**
 * Initialize bridge directories and files
 */
async function initializeBridge() {
  console.log('Initializing Galactic Roof AI Bridge...');
  
  try {
    // Ensure directories exist
    await fs.ensureDir(config.uploads.directory);
    await fs.ensureDir(config.webhooks.directory);
    
    // Create empty webhooks file if it doesn't exist
    const webhooksFile = path.join(config.webhooks.directory, 'webhooks.json');
    if (!await fs.pathExists(webhooksFile)) {
      await fs.writeJson(webhooksFile, [], { spaces: 2 });
      console.log('Created webhooks file');
    }
    
    // Create empty OAuth tokens file if it doesn't exist
    const tokensFile = path.join(config.webhooks.directory, 'oauth_tokens.json');
    if (!await fs.pathExists(tokensFile)) {
      await fs.writeJson(tokensFile, {}, { spaces: 2 });
      console.log('Created OAuth tokens file');
    }
    
    // Create .gitkeep files to ensure empty directories are tracked
    await fs.writeFile(path.join(config.uploads.directory, '.gitkeep'), '');
    
    console.log('Bridge initialization complete');
  } catch (error) {
    console.error('Error initializing bridge:', error);
    throw error;
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeBridge()
    .then(() => {
      console.log('Bridge initialization successful');
      process.exit(0);
    })
    .catch(error => {
      console.error('Bridge initialization failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = initializeBridge;
}