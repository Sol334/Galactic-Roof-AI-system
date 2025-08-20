/**
 * Bridge Services Index
 * 
 * Exports all bridge services for easy importing
 */

const weatherService = require('./weather');
const fileService = require('./files');
const webhookService = require('./webhooks');
const oauthService = require('./oauth');

module.exports = {
  weatherService,
  fileService,
  webhookService,
  oauthService
};