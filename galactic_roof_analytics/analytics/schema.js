/**
 * Galactic Roof AI - Analytics Schema Initialization
 * 
 * This module initializes the database schema for the analytics module.
 */

// Initialize analytics tables
const initialize = (db) => {
  // Create analytics_events table
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_source TEXT NOT NULL,
      user_id INTEGER,
      data JSON,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create indexes for analytics_events
  db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events (event_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events (timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events (user_id)`);

  // Create business_metrics table
  db.run(`
    CREATE TABLE IF NOT EXISTS business_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value REAL,
      dimension TEXT,
      dimension_value TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for business_metrics
  db.run(`CREATE INDEX IF NOT EXISTS idx_business_metrics_name ON business_metrics (metric_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_business_metrics_dates ON business_metrics (start_date, end_date)`);

  // Create lead_analytics table
  db.run(`
    CREATE TABLE IF NOT EXISTS lead_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      acquisition_source TEXT,
      acquisition_cost REAL,
      lead_score REAL,
      conversion_probability REAL,
      days_to_conversion INTEGER,
      converted_to_customer BOOLEAN DEFAULT FALSE,
      conversion_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    )
  `);

  // Create indexes for lead_analytics
  db.run(`CREATE INDEX IF NOT EXISTS idx_lead_analytics_lead_id ON lead_analytics (lead_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_lead_analytics_score ON lead_analytics (lead_score)`);

  // Create project_analytics table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      estimated_cost REAL,
      actual_cost REAL,
      cost_variance_percent REAL,
      estimated_duration INTEGER,
      actual_duration INTEGER,
      duration_variance_percent REAL,
      profit_margin REAL,
      weather_impact_score REAL,
      customer_satisfaction_score REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `);

  // Create indexes for project_analytics
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_analytics_project_id ON project_analytics (project_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_analytics_margin ON project_analytics (profit_margin)`);

  // Create customer_analytics table
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      lifetime_value REAL,
      acquisition_cost REAL,
      retention_score REAL,
      churn_probability REAL,
      referral_count INTEGER DEFAULT 0,
      project_count INTEGER DEFAULT 0,
      average_project_value REAL,
      last_interaction_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
  `);

  // Create indexes for customer_analytics
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer_id ON customer_analytics (customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_analytics_ltv ON customer_analytics (lifetime_value)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_analytics_churn ON customer_analytics (churn_probability)`);

  // Create weather_impact_analytics table
  db.run(`
    CREATE TABLE IF NOT EXISTS weather_impact_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weather_event_id INTEGER,
      leads_generated INTEGER DEFAULT 0,
      projects_created INTEGER DEFAULT 0,
      revenue_impact REAL,
      affected_zip_codes TEXT,
      impact_start_date TIMESTAMP,
      impact_end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (weather_event_id) REFERENCES weather_events (id)
    )
  `);

  // Create indexes for weather_impact_analytics
  db.run(`CREATE INDEX IF NOT EXISTS idx_weather_impact_analytics_event ON weather_impact_analytics (weather_event_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_weather_impact_analytics_dates ON weather_impact_analytics (impact_start_date, impact_end_date)`);

  // Create dashboard_configurations table
  db.run(`
    CREATE TABLE IF NOT EXISTS dashboard_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dashboard_name TEXT NOT NULL,
      configuration JSON,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create indexes for dashboard_configurations
  db.run(`CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user ON dashboard_configurations (user_id)`);

  // Create saved_reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      parameters JSON,
      schedule TEXT,
      last_generated TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create indexes for saved_reports
  db.run(`CREATE INDEX IF NOT EXISTS idx_saved_reports_user ON saved_reports (user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON saved_reports (report_type)`);

  // Create time_based_aggregates table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_based_aggregates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      aggregation_level TEXT NOT NULL,
      period_start TIMESTAMP NOT NULL,
      period_end TIMESTAMP NOT NULL,
      value REAL,
      dimension TEXT,
      dimension_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for time_based_aggregates
  db.run(`CREATE INDEX IF NOT EXISTS idx_time_based_aggregates_metric ON time_based_aggregates (metric_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_time_based_aggregates_level ON time_based_aggregates (aggregation_level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_time_based_aggregates_period ON time_based_aggregates (period_start, period_end)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_time_based_aggregates_dimension ON time_based_aggregates (dimension, dimension_value)`);

  // Create predictive_model_results table
  db.run(`
    CREATE TABLE IF NOT EXISTS predictive_model_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      prediction_type TEXT NOT NULL,
      prediction_value REAL,
      confidence_score REAL,
      features_used JSON,
      prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expiration_date TIMESTAMP
    )
  `);

  // Create indexes for predictive_model_results
  db.run(`CREATE INDEX IF NOT EXISTS idx_predictive_model_results_model ON predictive_model_results (model_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_predictive_model_results_entity ON predictive_model_results (entity_type, entity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_predictive_model_results_date ON predictive_model_results (prediction_date)`);

  console.log('Analytics schema initialized');
};

// Insert sample data for testing
const insertSampleData = (db) => {
  // Check if we already have data
  db.get('SELECT COUNT(*) as count FROM business_metrics', (err, row) => {
    if (err || row.count > 0) return;

    // Insert sample business metrics
    const metrics = [
      { name: 'revenue', value: 125000, start: '2025-01-01', end: '2025-01-31' },
      { name: 'revenue', value: 142000, start: '2025-02-01', end: '2025-02-28' },
      { name: 'revenue', value: 156000, start: '2025-03-01', end: '2025-03-31' },
      { name: 'revenue', value: 178000, start: '2025-04-01', end: '2025-04-30' },
      { name: 'revenue', value: 195000, start: '2025-05-01', end: '2025-05-31' },
      { name: 'revenue', value: 210000, start: '2025-06-01', end: '2025-06-30' },
      { name: 'revenue', value: 225000, start: '2025-07-01', end: '2025-07-31' },
      { name: 'revenue', value: 215000, start: '2025-08-01', end: '2025-08-19' },
      { name: 'profit', value: 31250, start: '2025-01-01', end: '2025-01-31' },
      { name: 'profit', value: 35500, start: '2025-02-01', end: '2025-02-28' },
      { name: 'profit', value: 39000, start: '2025-03-01', end: '2025-03-31' },
      { name: 'profit', value: 44500, start: '2025-04-01', end: '2025-04-30' },
      { name: 'profit', value: 48750, start: '2025-05-01', end: '2025-05-31' },
      { name: 'profit', value: 52500, start: '2025-06-01', end: '2025-06-30' },
      { name: 'profit', value: 56250, start: '2025-07-01', end: '2025-07-31' },
      { name: 'profit', value: 53750, start: '2025-08-01', end: '2025-08-19' },
      { name: 'leads', value: 45, start: '2025-01-01', end: '2025-01-31' },
      { name: 'leads', value: 52, start: '2025-02-01', end: '2025-02-28' },
      { name: 'leads', value: 58, start: '2025-03-01', end: '2025-03-31' },
      { name: 'leads', value: 67, start: '2025-04-01', end: '2025-04-30' },
      { name: 'leads', value: 72, start: '2025-05-01', end: '2025-05-31' },
      { name: 'leads', value: 78, start: '2025-06-01', end: '2025-06-30' },
      { name: 'leads', value: 85, start: '2025-07-01', end: '2025-07-31' },
      { name: 'leads', value: 79, start: '2025-08-01', end: '2025-08-19' },
      { name: 'projects', value: 18, start: '2025-01-01', end: '2025-01-31' },
      { name: 'projects', value: 21, start: '2025-02-01', end: '2025-02-28' },
      { name: 'projects', value: 23, start: '2025-03-01', end: '2025-03-31' },
      { name: 'projects', value: 27, start: '2025-04-01', end: '2025-04-30' },
      { name: 'projects', value: 29, start: '2025-05-01', end: '2025-05-31' },
      { name: 'projects', value: 31, start: '2025-06-01', end: '2025-06-30' },
      { name: 'projects', value: 34, start: '2025-07-01', end: '2025-07-31' },
      { name: 'projects', value: 32, start: '2025-08-01', end: '2025-08-19' }
    ];

    metrics.forEach(metric => {
      db.run(
        'INSERT INTO business_metrics (metric_name, metric_value, start_date, end_date) VALUES (?, ?, ?, ?)',
        [metric.name, metric.value, metric.start, metric.end]
      );
    });

    // Insert sample lead analytics
    db.all('SELECT id FROM leads', (err, leads) => {
      if (err || !leads.length) return;

      leads.forEach(lead => {
        const leadScore = Math.random() * 100;
        const conversionProb = leadScore / 100 * 0.8;
        const converted = Math.random() < conversionProb;
        const daysToConversion = converted ? Math.floor(Math.random() * 30) + 1 : null;
        const conversionDate = daysToConversion ? new Date(Date.now() - daysToConversion * 24 * 60 * 60 * 1000).toISOString() : null;

        db.run(
          `INSERT INTO lead_analytics 
           (lead_id, acquisition_source, acquisition_cost, lead_score, conversion_probability, 
            days_to_conversion, converted_to_customer, conversion_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.id,
            ['Website', 'Referral', 'Google', 'Facebook', 'Direct'][Math.floor(Math.random() * 5)],
            Math.floor(Math.random() * 200) + 50,
            leadScore,
            conversionProb,
            daysToConversion,
            converted ? 1 : 0,
            conversionDate
          ]
        );
      });
    });

    // Insert sample project analytics
    db.all('SELECT id FROM projects', (err, projects) => {
      if (err || !projects.length) return;

      projects.forEach(project => {
        const estimatedCost = Math.floor(Math.random() * 10000) + 5000;
        const actualCost = estimatedCost * (Math.random() * 0.4 + 0.8); // 80% to 120% of estimate
        const costVariance = ((actualCost - estimatedCost) / estimatedCost) * 100;
        
        const estimatedDuration = Math.floor(Math.random() * 20) + 5;
        const actualDuration = estimatedDuration * (Math.random() * 0.4 + 0.8); // 80% to 120% of estimate
        const durationVariance = ((actualDuration - estimatedDuration) / estimatedDuration) * 100;
        
        const profitMargin = Math.random() * 0.3 + 0.15; // 15% to 45%
        
        db.run(
          `INSERT INTO project_analytics 
           (project_id, estimated_cost, actual_cost, cost_variance_percent, 
            estimated_duration, actual_duration, duration_variance_percent, 
            profit_margin, weather_impact_score, customer_satisfaction_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            project.id,
            estimatedCost,
            actualCost,
            costVariance,
            estimatedDuration,
            actualDuration,
            durationVariance,
            profitMargin,
            Math.random() * 5,
            Math.random() * 5
          ]
        );
      });
    });

    // Insert sample customer analytics
    db.all('SELECT id FROM customers', (err, customers) => {
      if (err || !customers.length) return;

      customers.forEach(customer => {
        const projectCount = Math.floor(Math.random() * 3) + 1;
        const avgProjectValue = Math.floor(Math.random() * 15000) + 5000;
        const lifetimeValue = avgProjectValue * projectCount;
        const acquisitionCost = Math.floor(Math.random() * 500) + 100;
        const retentionScore = Math.random() * 100;
        const churnProbability = Math.max(0, 1 - (retentionScore / 100));
        
        db.run(
          `INSERT INTO customer_analytics 
           (customer_id, lifetime_value, acquisition_cost, retention_score, 
            churn_probability, referral_count, project_count, average_project_value, 
            last_interaction_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customer.id,
            lifetimeValue,
            acquisitionCost,
            retentionScore,
            churnProbability,
            Math.floor(Math.random() * 3),
            projectCount,
            avgProjectValue,
            new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString()
          ]
        );
      });
    });

    // Insert sample weather impact analytics
    db.all('SELECT id FROM weather_events', (err, events) => {
      if (err || !events.length) return;

      events.forEach(event => {
        const leadsGenerated = Math.floor(Math.random() * 20) + 5;
        const projectsCreated = Math.floor(leadsGenerated * (Math.random() * 0.5 + 0.2)); // 20% to 70% conversion
        const revenueImpact = projectsCreated * (Math.floor(Math.random() * 10000) + 5000);
        
        db.run(
          `INSERT INTO weather_impact_analytics 
           (weather_event_id, leads_generated, projects_created, revenue_impact, 
            affected_zip_codes, impact_start_date, impact_end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            event.id,
            leadsGenerated,
            projectsCreated,
            revenueImpact,
            '62701,62702,62703,62704',
            new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
          ]
        );
      });
    });

    // Insert sample predictive model results
    db.all('SELECT id FROM leads', (err, leads) => {
      if (err || !leads.length) return;

      leads.slice(0, 10).forEach(lead => {
        db.run(
          `INSERT INTO predictive_model_results 
           (model_name, entity_type, entity_id, prediction_type, 
            prediction_value, confidence_score, features_used, expiration_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'lead_conversion_model',
            'lead',
            lead.id,
            'conversion_probability',
            Math.random() * 0.8 + 0.1, // 10% to 90%
            Math.random() * 0.5 + 0.5, // 50% to 100%
            JSON.stringify({
              'source': 1,
              'service_interest': 1,
              'location': 1,
              'weather_events': 1
            }),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          ]
        );
      });
    });

    db.all('SELECT id FROM customers', (err, customers) => {
      if (err || !customers.length) return;

      customers.slice(0, 5).forEach(customer => {
        db.run(
          `INSERT INTO predictive_model_results 
           (model_name, entity_type, entity_id, prediction_type, 
            prediction_value, confidence_score, features_used, expiration_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'customer_churn_model',
            'customer',
            customer.id,
            'churn_probability',
            Math.random() * 0.5, // 0% to 50%
            Math.random() * 0.3 + 0.6, // 60% to 90%
            JSON.stringify({
              'project_count': 1,
              'last_interaction': 1,
              'satisfaction_score': 1,
              'payment_history': 1
            }),
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
          ]
        );
      });
    });

    console.log('Sample analytics data inserted');
  });
};

module.exports = {
  initialize,
  insertSampleData
};