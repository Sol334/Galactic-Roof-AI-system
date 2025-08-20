-- Analytics Database Schema for Galactic Roof AI

-- Analytics Events Table
-- Stores all trackable events in the system
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  user_id INTEGER,
  data JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create index for faster queries
CREATE INDEX idx_analytics_events_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events (timestamp);
CREATE INDEX idx_analytics_events_user ON analytics_events (user_id);

-- Business Metrics Table
-- Stores aggregated business metrics
CREATE TABLE business_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  dimension TEXT,
  dimension_value TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_business_metrics_name ON business_metrics (metric_name);
CREATE INDEX idx_business_metrics_dates ON business_metrics (start_date, end_date);

-- Lead Analytics Table
-- Stores enriched lead data for analytics
CREATE TABLE lead_analytics (
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
);

-- Create index for faster queries
CREATE INDEX idx_lead_analytics_lead_id ON lead_analytics (lead_id);
CREATE INDEX idx_lead_analytics_score ON lead_analytics (lead_score);

-- Project Analytics Table
-- Stores enriched project data for analytics
CREATE TABLE project_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  estimated_cost REAL,
  actual_cost REAL,
  cost_variance_percent REAL,
  estimated_duration INTEGER, -- in days
  actual_duration INTEGER, -- in days
  duration_variance_percent REAL,
  profit_margin REAL,
  weather_impact_score REAL,
  customer_satisfaction_score REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- Create index for faster queries
CREATE INDEX idx_project_analytics_project_id ON project_analytics (project_id);
CREATE INDEX idx_project_analytics_margin ON project_analytics (profit_margin);

-- Customer Analytics Table
-- Stores enriched customer data for analytics
CREATE TABLE customer_analytics (
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
);

-- Create index for faster queries
CREATE INDEX idx_customer_analytics_customer_id ON customer_analytics (customer_id);
CREATE INDEX idx_customer_analytics_ltv ON customer_analytics (lifetime_value);
CREATE INDEX idx_customer_analytics_churn ON customer_analytics (churn_probability);

-- Weather Impact Analytics
-- Correlates weather events with business metrics
CREATE TABLE weather_impact_analytics (
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
);

-- Create index for faster queries
CREATE INDEX idx_weather_impact_analytics_event ON weather_impact_analytics (weather_event_id);
CREATE INDEX idx_weather_impact_analytics_dates ON weather_impact_analytics (impact_start_date, impact_end_date);

-- Dashboard Configurations
-- Stores user dashboard preferences
CREATE TABLE dashboard_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  dashboard_name TEXT NOT NULL,
  configuration JSON,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create index for faster queries
CREATE INDEX idx_dashboard_configurations_user ON dashboard_configurations (user_id);

-- Saved Reports
-- Stores saved/scheduled reports
CREATE TABLE saved_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  parameters JSON,
  schedule TEXT, -- cron format for scheduled reports
  last_generated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create index for faster queries
CREATE INDEX idx_saved_reports_user ON saved_reports (user_id);
CREATE INDEX idx_saved_reports_type ON saved_reports (report_type);

-- Time-based Aggregates
-- Stores pre-computed aggregates for faster dashboard loading
CREATE TABLE time_based_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  aggregation_level TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  value REAL,
  dimension TEXT,
  dimension_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_time_based_aggregates_metric ON time_based_aggregates (metric_name);
CREATE INDEX idx_time_based_aggregates_level ON time_based_aggregates (aggregation_level);
CREATE INDEX idx_time_based_aggregates_period ON time_based_aggregates (period_start, period_end);
CREATE INDEX idx_time_based_aggregates_dimension ON time_based_aggregates (dimension, dimension_value);

-- Predictive Model Results
-- Stores results from predictive models
CREATE TABLE predictive_model_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'lead', 'customer', 'project', etc.
  entity_id INTEGER NOT NULL,
  prediction_type TEXT NOT NULL,
  prediction_value REAL,
  confidence_score REAL,
  features_used JSON,
  prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_predictive_model_results_model ON predictive_model_results (model_name);
CREATE INDEX idx_predictive_model_results_entity ON predictive_model_results (entity_type, entity_id);
CREATE INDEX idx_predictive_model_results_date ON predictive_model_results (prediction_date);