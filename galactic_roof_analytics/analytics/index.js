/**
 * Galactic Roof AI - Analytics Module
 * 
 * This module provides analytics data collection, processing, and retrieval
 * capabilities for the Galactic Roof AI system.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Create router
const router = express.Router();

// Connect to database
const db = new sqlite3.Database(path.join(__dirname, '../database/galacticroof.db'));

// Initialize analytics tables if they don't exist
const initializeAnalytics = () => {
  const analyticsSchema = require('./schema');
  analyticsSchema.initialize(db);
};

// Track an analytics event
const trackEvent = (eventType, eventSource, userId = null, data = {}) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO analytics_events (event_type, event_source, user_id, data)
      VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [eventType, eventSource, userId, JSON.stringify(data)], function(err) {
      if (err) {
        console.error('Error tracking analytics event:', err);
        reject(err);
        return;
      }
      
      resolve({
        id: this.lastID,
        eventType,
        eventSource,
        userId,
        data,
        timestamp: new Date()
      });
    });
  });
};

// Get dashboard metrics
const getDashboardMetrics = async (userId, role) => {
  const metrics = {};
  
  // Get lead conversion rate
  const leadConversionRate = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        COUNT(CASE WHEN converted_to_customer = TRUE THEN 1 END) * 100.0 / COUNT(*) as conversion_rate
      FROM lead_analytics
    `, (err, row) => {
      if (err) {
        console.error('Error getting lead conversion rate:', err);
        resolve(null);
        return;
      }
      
      resolve(row?.conversion_rate || 0);
    });
  });
  
  metrics.leadConversionRate = leadConversionRate;
  
  // Get average project profit margin
  const avgProfitMargin = await new Promise((resolve, reject) => {
    db.get(`
      SELECT AVG(profit_margin) as avg_profit_margin
      FROM project_analytics
    `, (err, row) => {
      if (err) {
        console.error('Error getting average profit margin:', err);
        resolve(null);
        return;
      }
      
      resolve(row?.avg_profit_margin || 0);
    });
  });
  
  metrics.avgProfitMargin = avgProfitMargin;
  
  // Get customer lifetime value
  const avgCustomerLTV = await new Promise((resolve, reject) => {
    db.get(`
      SELECT AVG(lifetime_value) as avg_ltv
      FROM customer_analytics
    `, (err, row) => {
      if (err) {
        console.error('Error getting average customer LTV:', err);
        resolve(null);
        return;
      }
      
      resolve(row?.avg_ltv || 0);
    });
  });
  
  metrics.avgCustomerLTV = avgCustomerLTV;
  
  // Get weather impact on business
  const weatherImpact = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        we.event_type,
        SUM(wia.leads_generated) as total_leads,
        SUM(wia.revenue_impact) as total_revenue
      FROM weather_impact_analytics wia
      JOIN weather_events we ON wia.weather_event_id = we.id
      GROUP BY we.event_type
      ORDER BY total_revenue DESC
      LIMIT 5
    `, (err, rows) => {
      if (err) {
        console.error('Error getting weather impact:', err);
        resolve([]);
        return;
      }
      
      resolve(rows || []);
    });
  });
  
  metrics.weatherImpact = weatherImpact;
  
  // Get recent business metrics
  const recentMetrics = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        metric_name,
        metric_value,
        start_date,
        end_date
      FROM business_metrics
      ORDER BY end_date DESC
      LIMIT 10
    `, (err, rows) => {
      if (err) {
        console.error('Error getting recent metrics:', err);
        resolve([]);
        return;
      }
      
      resolve(rows || []);
    });
  });
  
  metrics.recentMetrics = recentMetrics;
  
  // If admin or manager, include financial metrics
  if (role === 'admin' || role === 'manager') {
    // Get revenue by month
    const revenueByMonth = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          strftime('%Y-%m', end_date) as month,
          SUM(metric_value) as revenue
        FROM business_metrics
        WHERE metric_name = 'revenue'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `, (err, rows) => {
        if (err) {
          console.error('Error getting revenue by month:', err);
          resolve([]);
          return;
        }
        
        resolve(rows || []);
      });
    });
    
    metrics.revenueByMonth = revenueByMonth;
  }
  
  return metrics;
};

// Get lead analytics
const getLeadAnalytics = async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        la.lead_id,
        l.name,
        l.source,
        la.acquisition_source,
        la.lead_score,
        la.conversion_probability,
        la.days_to_conversion,
        la.converted_to_customer,
        la.conversion_date
      FROM lead_analytics la
      JOIN leads l ON la.lead_id = l.id
      ORDER BY la.lead_score DESC
      LIMIT 100
    `, (err, rows) => {
      if (err) {
        console.error('Error getting lead analytics:', err);
        reject(err);
        return;
      }
      
      resolve(rows || []);
    });
  });
};

// Get project analytics
const getProjectAnalytics = async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        pa.project_id,
        p.project_type,
        p.status,
        pa.estimated_cost,
        pa.actual_cost,
        pa.cost_variance_percent,
        pa.estimated_duration,
        pa.actual_duration,
        pa.duration_variance_percent,
        pa.profit_margin,
        pa.customer_satisfaction_score
      FROM project_analytics pa
      JOIN projects p ON pa.project_id = p.id
      ORDER BY pa.created_at DESC
      LIMIT 100
    `, (err, rows) => {
      if (err) {
        console.error('Error getting project analytics:', err);
        reject(err);
        return;
      }
      
      resolve(rows || []);
    });
  });
};

// Get customer analytics
const getCustomerAnalytics = async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        ca.customer_id,
        c.name,
        ca.lifetime_value,
        ca.acquisition_cost,
        ca.retention_score,
        ca.churn_probability,
        ca.referral_count,
        ca.project_count,
        ca.average_project_value
      FROM customer_analytics ca
      JOIN customers c ON ca.customer_id = c.id
      ORDER BY ca.lifetime_value DESC
      LIMIT 100
    `, (err, rows) => {
      if (err) {
        console.error('Error getting customer analytics:', err);
        reject(err);
        return;
      }
      
      resolve(rows || []);
    });
  });
};

// Get weather impact analytics
const getWeatherImpactAnalytics = async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        wia.id,
        we.event_type,
        we.severity,
        we.city,
        we.state,
        wia.leads_generated,
        wia.projects_created,
        wia.revenue_impact,
        wia.affected_zip_codes,
        wia.impact_start_date,
        wia.impact_end_date
      FROM weather_impact_analytics wia
      JOIN weather_events we ON wia.weather_event_id = we.id
      ORDER BY wia.impact_start_date DESC
      LIMIT 100
    `, (err, rows) => {
      if (err) {
        console.error('Error getting weather impact analytics:', err);
        reject(err);
        return;
      }
      
      resolve(rows || []);
    });
  });
};

// Get predictive insights
const getPredictiveInsights = async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        model_name,
        entity_type,
        entity_id,
        prediction_type,
        prediction_value,
        confidence_score,
        prediction_date
      FROM predictive_model_results
      WHERE expiration_date > datetime('now')
      ORDER BY prediction_date DESC
      LIMIT 100
    `, (err, rows) => {
      if (err) {
        console.error('Error getting predictive insights:', err);
        reject(err);
        return;
      }
      
      resolve(rows || []);
    });
  });
};

// API Routes

// Get dashboard metrics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const metrics = await getDashboardMetrics(req.user.id, req.user.role);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to get dashboard metrics' });
  }
});

// Get lead analytics
router.get('/leads', authenticateToken, async (req, res) => {
  try {
    const leadAnalytics = await getLeadAnalytics();
    res.json(leadAnalytics);
  } catch (error) {
    console.error('Error getting lead analytics:', error);
    res.status(500).json({ error: 'Failed to get lead analytics' });
  }
});

// Get project analytics
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projectAnalytics = await getProjectAnalytics();
    res.json(projectAnalytics);
  } catch (error) {
    console.error('Error getting project analytics:', error);
    res.status(500).json({ error: 'Failed to get project analytics' });
  }
});

// Get customer analytics
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const customerAnalytics = await getCustomerAnalytics();
    res.json(customerAnalytics);
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    res.status(500).json({ error: 'Failed to get customer analytics' });
  }
});

// Get weather impact analytics
router.get('/weather-impact', authenticateToken, async (req, res) => {
  try {
    const weatherImpactAnalytics = await getWeatherImpactAnalytics();
    res.json(weatherImpactAnalytics);
  } catch (error) {
    console.error('Error getting weather impact analytics:', error);
    res.status(500).json({ error: 'Failed to get weather impact analytics' });
  }
});

// Get predictive insights
router.get('/predictive', authenticateToken, async (req, res) => {
  try {
    const predictiveInsights = await getPredictiveInsights();
    res.json(predictiveInsights);
  } catch (error) {
    console.error('Error getting predictive insights:', error);
    res.status(500).json({ error: 'Failed to get predictive insights' });
  }
});

// Get saved reports
router.get('/reports', authenticateToken, (req, res) => {
  db.all(`
    SELECT id, report_name, report_type, parameters, schedule, last_generated, created_at
    FROM saved_reports
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error getting saved reports:', err);
      res.status(500).json({ error: 'Failed to get saved reports' });
      return;
    }
    
    res.json(rows || []);
  });
});

// Save a report
router.post('/reports', authenticateToken, (req, res) => {
  const { report_name, report_type, parameters, schedule } = req.body;
  
  if (!report_name || !report_type) {
    return res.status(400).json({ error: 'Report name and type are required' });
  }
  
  db.run(`
    INSERT INTO saved_reports (user_id, report_name, report_type, parameters, schedule)
    VALUES (?, ?, ?, ?, ?)
  `, [req.user.id, report_name, report_type, JSON.stringify(parameters), schedule], function(err) {
    if (err) {
      console.error('Error saving report:', err);
      res.status(500).json({ error: 'Failed to save report' });
      return;
    }
    
    res.status(201).json({
      id: this.lastID,
      report_name,
      report_type,
      parameters,
      schedule,
      created_at: new Date()
    });
  });
});

// Get dashboard configurations
router.get('/dashboard-config', authenticateToken, (req, res) => {
  db.all(`
    SELECT id, dashboard_name, configuration, is_default, created_at, updated_at
    FROM dashboard_configurations
    WHERE user_id = ?
    ORDER BY is_default DESC, created_at DESC
  `, [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error getting dashboard configurations:', err);
      res.status(500).json({ error: 'Failed to get dashboard configurations' });
      return;
    }
    
    res.json(rows || []);
  });
});

// Save dashboard configuration
router.post('/dashboard-config', authenticateToken, (req, res) => {
  const { dashboard_name, configuration, is_default } = req.body;
  
  if (!dashboard_name || !configuration) {
    return res.status(400).json({ error: 'Dashboard name and configuration are required' });
  }
  
  // If setting as default, unset any existing default
  if (is_default) {
    db.run(`
      UPDATE dashboard_configurations
      SET is_default = FALSE
      WHERE user_id = ? AND is_default = TRUE
    `, [req.user.id]);
  }
  
  db.run(`
    INSERT INTO dashboard_configurations (user_id, dashboard_name, configuration, is_default, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `, [req.user.id, dashboard_name, JSON.stringify(configuration), is_default ? 1 : 0], function(err) {
    if (err) {
      console.error('Error saving dashboard configuration:', err);
      res.status(500).json({ error: 'Failed to save dashboard configuration' });
      return;
    }
    
    res.status(201).json({
      id: this.lastID,
      dashboard_name,
      configuration,
      is_default,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
});

// Initialize analytics tables
initializeAnalytics();

// Export router and utility functions
module.exports = {
  router,
  trackEvent,
  getDashboardMetrics,
  getLeadAnalytics,
  getProjectAnalytics,
  getCustomerAnalytics,
  getWeatherImpactAnalytics,
  getPredictiveInsights
};