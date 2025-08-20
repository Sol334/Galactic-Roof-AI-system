/**
 * Galactic Roof AI - Analytics Data Processor
 * 
 * This module processes raw data and generates analytics insights.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const db = new sqlite3.Database(path.join(__dirname, '../database/galacticroof.db'));

/**
 * Process lead data to generate analytics
 * @param {Object} lead - Lead data
 * @returns {Promise} - Promise resolving to lead analytics
 */
const processLeadData = async (lead) => {
  return new Promise((resolve, reject) => {
    // Check if lead analytics already exists
    db.get('SELECT id FROM lead_analytics WHERE lead_id = ?', [lead.id], (err, row) => {
      if (err) {
        console.error('Error checking lead analytics:', err);
        reject(err);
        return;
      }
      
      // Calculate lead score based on various factors
      let leadScore = 50; // Base score
      
      // Adjust score based on source
      if (lead.source) {
        switch (lead.source.toLowerCase()) {
          case 'referral':
            leadScore += 20;
            break;
          case 'website':
            leadScore += 15;
            break;
          case 'google':
            leadScore += 10;
            break;
          case 'facebook':
            leadScore += 5;
            break;
        }
      }
      
      // Adjust score based on service interest
      if (lead.service_interest) {
        if (lead.service_interest.toLowerCase().includes('roof replacement')) {
          leadScore += 15;
        } else if (lead.service_interest.toLowerCase().includes('repair')) {
          leadScore += 10;
        } else if (lead.service_interest.toLowerCase().includes('inspection')) {
          leadScore += 5;
        }
      }
      
      // Cap score at 100
      leadScore = Math.min(100, leadScore);
      
      // Calculate conversion probability based on score
      const conversionProbability = leadScore / 100 * 0.8; // Max 80% probability
      
      // Determine acquisition source and cost
      const acquisitionSource = lead.source || 'Unknown';
      let acquisitionCost = 0;
      
      switch (acquisitionSource.toLowerCase()) {
        case 'google':
          acquisitionCost = 75;
          break;
        case 'facebook':
          acquisitionCost = 50;
          break;
        case 'website':
          acquisitionCost = 25;
          break;
        case 'referral':
          acquisitionCost = 100; // Referral bonus
          break;
        default:
          acquisitionCost = 40;
      }
      
      const leadAnalytics = {
        lead_id: lead.id,
        acquisition_source: acquisitionSource,
        acquisition_cost: acquisitionCost,
        lead_score: leadScore,
        conversion_probability: conversionProbability,
        days_to_conversion: null,
        converted_to_customer: false,
        conversion_date: null
      };
      
      if (row) {
        // Update existing lead analytics
        db.run(
          `UPDATE lead_analytics 
           SET acquisition_source = ?, acquisition_cost = ?, lead_score = ?, conversion_probability = ?
           WHERE lead_id = ?`,
          [
            leadAnalytics.acquisition_source,
            leadAnalytics.acquisition_cost,
            leadAnalytics.lead_score,
            leadAnalytics.conversion_probability,
            lead.id
          ],
          function(err) {
            if (err) {
              console.error('Error updating lead analytics:', err);
              reject(err);
              return;
            }
            
            resolve(leadAnalytics);
          }
        );
      } else {
        // Insert new lead analytics
        db.run(
          `INSERT INTO lead_analytics 
           (lead_id, acquisition_source, acquisition_cost, lead_score, conversion_probability, 
            days_to_conversion, converted_to_customer, conversion_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            leadAnalytics.lead_id,
            leadAnalytics.acquisition_source,
            leadAnalytics.acquisition_cost,
            leadAnalytics.lead_score,
            leadAnalytics.conversion_probability,
            leadAnalytics.days_to_conversion,
            leadAnalytics.converted_to_customer ? 1 : 0,
            leadAnalytics.conversion_date
          ],
          function(err) {
            if (err) {
              console.error('Error inserting lead analytics:', err);
              reject(err);
              return;
            }
            
            leadAnalytics.id = this.lastID;
            resolve(leadAnalytics);
          }
        );
      }
    });
  });
};

/**
 * Process project data to generate analytics
 * @param {Object} project - Project data
 * @returns {Promise} - Promise resolving to project analytics
 */
const processProjectData = async (project) => {
  return new Promise((resolve, reject) => {
    // Check if project analytics already exists
    db.get('SELECT id FROM project_analytics WHERE project_id = ?', [project.id], (err, row) => {
      if (err) {
        console.error('Error checking project analytics:', err);
        reject(err);
        return;
      }
      
      // Calculate project metrics
      const estimatedCost = project.contract_amount * 0.6; // Estimated cost is 60% of contract amount
      const actualCost = estimatedCost * (Math.random() * 0.3 + 0.85); // 85% to 115% of estimate
      const costVariancePercent = ((actualCost - estimatedCost) / estimatedCost) * 100;
      
      // Calculate duration metrics
      let estimatedDuration = 14; // Default 2 weeks
      if (project.project_type) {
        if (project.project_type.toLowerCase().includes('replacement')) {
          estimatedDuration = 21; // 3 weeks for replacement
        } else if (project.project_type.toLowerCase().includes('repair')) {
          estimatedDuration = 7; // 1 week for repair
        }
      }
      
      // Calculate actual duration based on start and end dates
      let actualDuration = estimatedDuration;
      if (project.start_date && project.end_date) {
        const startDate = new Date(project.start_date);
        const endDate = new Date(project.end_date);
        const diffTime = Math.abs(endDate - startDate);
        actualDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      const durationVariancePercent = ((actualDuration - estimatedDuration) / estimatedDuration) * 100;
      
      // Calculate profit margin
      const profitMargin = (project.contract_amount - actualCost) / project.contract_amount;
      
      // Calculate customer satisfaction score (random for now)
      const customerSatisfactionScore = Math.random() * 2 + 3; // 3 to 5 score
      
      const projectAnalytics = {
        project_id: project.id,
        estimated_cost: estimatedCost,
        actual_cost: actualCost,
        cost_variance_percent: costVariancePercent,
        estimated_duration: estimatedDuration,
        actual_duration: actualDuration,
        duration_variance_percent: durationVariancePercent,
        profit_margin: profitMargin,
        weather_impact_score: 0, // Will be calculated separately
        customer_satisfaction_score: customerSatisfactionScore
      };
      
      if (row) {
        // Update existing project analytics
        db.run(
          `UPDATE project_analytics 
           SET estimated_cost = ?, actual_cost = ?, cost_variance_percent = ?,
               estimated_duration = ?, actual_duration = ?, duration_variance_percent = ?,
               profit_margin = ?, customer_satisfaction_score = ?
           WHERE project_id = ?`,
          [
            projectAnalytics.estimated_cost,
            projectAnalytics.actual_cost,
            projectAnalytics.cost_variance_percent,
            projectAnalytics.estimated_duration,
            projectAnalytics.actual_duration,
            projectAnalytics.duration_variance_percent,
            projectAnalytics.profit_margin,
            projectAnalytics.customer_satisfaction_score,
            project.id
          ],
          function(err) {
            if (err) {
              console.error('Error updating project analytics:', err);
              reject(err);
              return;
            }
            
            resolve(projectAnalytics);
          }
        );
      } else {
        // Insert new project analytics
        db.run(
          `INSERT INTO project_analytics 
           (project_id, estimated_cost, actual_cost, cost_variance_percent,
            estimated_duration, actual_duration, duration_variance_percent,
            profit_margin, weather_impact_score, customer_satisfaction_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectAnalytics.project_id,
            projectAnalytics.estimated_cost,
            projectAnalytics.actual_cost,
            projectAnalytics.cost_variance_percent,
            projectAnalytics.estimated_duration,
            projectAnalytics.actual_duration,
            projectAnalytics.duration_variance_percent,
            projectAnalytics.profit_margin,
            projectAnalytics.weather_impact_score,
            projectAnalytics.customer_satisfaction_score
          ],
          function(err) {
            if (err) {
              console.error('Error inserting project analytics:', err);
              reject(err);
              return;
            }
            
            projectAnalytics.id = this.lastID;
            resolve(projectAnalytics);
          }
        );
      }
    });
  });
};

/**
 * Process customer data to generate analytics
 * @param {Object} customer - Customer data
 * @returns {Promise} - Promise resolving to customer analytics
 */
const processCustomerData = async (customer) => {
  return new Promise((resolve, reject) => {
    // Get all projects for this customer
    db.all('SELECT * FROM projects WHERE customer_id = ?', [customer.id], (err, projects) => {
      if (err) {
        console.error('Error getting customer projects:', err);
        reject(err);
        return;
      }
      
      // Calculate customer metrics
      const projectCount = projects.length;
      let totalProjectValue = 0;
      
      projects.forEach(project => {
        totalProjectValue += project.contract_amount || 0;
      });
      
      const averageProjectValue = projectCount > 0 ? totalProjectValue / projectCount : 0;
      
      // Calculate lifetime value (LTV)
      // Simple LTV = Average Project Value * Project Count * (1 + Repeat Business Factor)
      const repeatBusinessFactor = 0.3; // 30% chance of repeat business
      const lifetimeValue = averageProjectValue * projectCount * (1 + repeatBusinessFactor);
      
      // Calculate acquisition cost (random for now)
      const acquisitionCost = Math.floor(Math.random() * 300) + 100;
      
      // Calculate retention score based on project count and recency
      let retentionScore = 50; // Base score
      
      // Adjust for project count
      if (projectCount > 3) {
        retentionScore += 30;
      } else if (projectCount > 1) {
        retentionScore += 15;
      }
      
      // Adjust for recency of last project
      if (projects.length > 0) {
        const lastProject = projects.reduce((latest, project) => {
          const projectDate = project.end_date || project.start_date;
          const latestDate = latest.end_date || latest.start_date;
          
          if (!latestDate) return project;
          if (!projectDate) return latest;
          
          return new Date(projectDate) > new Date(latestDate) ? project : latest;
        }, {});
        
        const lastProjectDate = lastProject.end_date || lastProject.start_date;
        
        if (lastProjectDate) {
          const daysSinceLastProject = Math.floor((new Date() - new Date(lastProjectDate)) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastProject < 90) {
            retentionScore += 20;
          } else if (daysSinceLastProject < 180) {
            retentionScore += 10;
          } else if (daysSinceLastProject > 365) {
            retentionScore -= 10;
          }
        }
      }
      
      // Cap retention score at 100
      retentionScore = Math.min(100, Math.max(0, retentionScore));
      
      // Calculate churn probability (inverse of retention)
      const churnProbability = Math.max(0, 1 - (retentionScore / 100) * 0.9); // Max 90% retention
      
      // Calculate referral count (random for now)
      const referralCount = Math.floor(Math.random() * 3);
      
      const customerAnalytics = {
        customer_id: customer.id,
        lifetime_value: lifetimeValue,
        acquisition_cost: acquisitionCost,
        retention_score: retentionScore,
        churn_probability: churnProbability,
        referral_count: referralCount,
        project_count: projectCount,
        average_project_value: averageProjectValue,
        last_interaction_date: new Date().toISOString()
      };
      
      // Check if customer analytics already exists
      db.get('SELECT id FROM customer_analytics WHERE customer_id = ?', [customer.id], (err, row) => {
        if (err) {
          console.error('Error checking customer analytics:', err);
          reject(err);
          return;
        }
        
        if (row) {
          // Update existing customer analytics
          db.run(
            `UPDATE customer_analytics 
             SET lifetime_value = ?, acquisition_cost = ?, retention_score = ?,
                 churn_probability = ?, referral_count = ?, project_count = ?,
                 average_project_value = ?, last_interaction_date = ?
             WHERE customer_id = ?`,
            [
              customerAnalytics.lifetime_value,
              customerAnalytics.acquisition_cost,
              customerAnalytics.retention_score,
              customerAnalytics.churn_probability,
              customerAnalytics.referral_count,
              customerAnalytics.project_count,
              customerAnalytics.average_project_value,
              customerAnalytics.last_interaction_date,
              customer.id
            ],
            function(err) {
              if (err) {
                console.error('Error updating customer analytics:', err);
                reject(err);
                return;
              }
              
              resolve(customerAnalytics);
            }
          );
        } else {
          // Insert new customer analytics
          db.run(
            `INSERT INTO customer_analytics 
             (customer_id, lifetime_value, acquisition_cost, retention_score,
              churn_probability, referral_count, project_count, average_project_value,
              last_interaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              customerAnalytics.customer_id,
              customerAnalytics.lifetime_value,
              customerAnalytics.acquisition_cost,
              customerAnalytics.retention_score,
              customerAnalytics.churn_probability,
              customerAnalytics.referral_count,
              customerAnalytics.project_count,
              customerAnalytics.average_project_value,
              customerAnalytics.last_interaction_date
            ],
            function(err) {
              if (err) {
                console.error('Error inserting customer analytics:', err);
                reject(err);
                return;
              }
              
              customerAnalytics.id = this.lastID;
              resolve(customerAnalytics);
            }
          );
        }
      });
    });
  });
};

/**
 * Process weather event data to generate analytics
 * @param {Object} weatherEvent - Weather event data
 * @returns {Promise} - Promise resolving to weather impact analytics
 */
const processWeatherEventData = async (weatherEvent) => {
  return new Promise((resolve, reject) => {
    // Check if weather impact analytics already exists
    db.get('SELECT id FROM weather_impact_analytics WHERE weather_event_id = ?', [weatherEvent.id], (err, row) => {
      if (err) {
        console.error('Error checking weather impact analytics:', err);
        reject(err);
        return;
      }
      
      // Calculate impact metrics based on event type and severity
      let leadsGenerated = 0;
      let projectsCreated = 0;
      let revenueImpact = 0;
      
      // Base impact by event type
      switch (weatherEvent.event_type?.toLowerCase()) {
        case 'hail storm':
          leadsGenerated = Math.floor(weatherEvent.severity * 5);
          break;
        case 'tornado':
          leadsGenerated = Math.floor(weatherEvent.severity * 8);
          break;
        case 'hurricane':
          leadsGenerated = Math.floor(weatherEvent.severity * 10);
          break;
        case 'wind storm':
          leadsGenerated = Math.floor(weatherEvent.severity * 4);
          break;
        case 'heavy rain':
          leadsGenerated = Math.floor(weatherEvent.severity * 2);
          break;
        default:
          leadsGenerated = Math.floor(weatherEvent.severity * 3);
      }
      
      // Calculate projects created (conversion rate)
      projectsCreated = Math.floor(leadsGenerated * 0.4); // 40% conversion rate
      
      // Calculate revenue impact
      const avgProjectValue = 8500; // Average project value
      revenueImpact = projectsCreated * avgProjectValue;
      
      // Determine affected zip codes
      const affectedZipCodes = weatherEvent.zip ? [weatherEvent.zip] : [];
      
      // Set impact dates
      const eventDate = new Date(weatherEvent.event_date);
      const impactStartDate = eventDate.toISOString();
      const impactEndDate = new Date(eventDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days after event
      
      const weatherImpactAnalytics = {
        weather_event_id: weatherEvent.id,
        leads_generated: leadsGenerated,
        projects_created: projectsCreated,
        revenue_impact: revenueImpact,
        affected_zip_codes: affectedZipCodes.join(','),
        impact_start_date: impactStartDate,
        impact_end_date: impactEndDate
      };
      
      if (row) {
        // Update existing weather impact analytics
        db.run(
          `UPDATE weather_impact_analytics 
           SET leads_generated = ?, projects_created = ?, revenue_impact = ?,
               affected_zip_codes = ?, impact_start_date = ?, impact_end_date = ?
           WHERE weather_event_id = ?`,
          [
            weatherImpactAnalytics.leads_generated,
            weatherImpactAnalytics.projects_created,
            weatherImpactAnalytics.revenue_impact,
            weatherImpactAnalytics.affected_zip_codes,
            weatherImpactAnalytics.impact_start_date,
            weatherImpactAnalytics.impact_end_date,
            weatherEvent.id
          ],
          function(err) {
            if (err) {
              console.error('Error updating weather impact analytics:', err);
              reject(err);
              return;
            }
            
            resolve(weatherImpactAnalytics);
          }
        );
      } else {
        // Insert new weather impact analytics
        db.run(
          `INSERT INTO weather_impact_analytics 
           (weather_event_id, leads_generated, projects_created, revenue_impact,
            affected_zip_codes, impact_start_date, impact_end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            weatherImpactAnalytics.weather_event_id,
            weatherImpactAnalytics.leads_generated,
            weatherImpactAnalytics.projects_created,
            weatherImpactAnalytics.revenue_impact,
            weatherImpactAnalytics.affected_zip_codes,
            weatherImpactAnalytics.impact_start_date,
            weatherImpactAnalytics.impact_end_date
          ],
          function(err) {
            if (err) {
              console.error('Error inserting weather impact analytics:', err);
              reject(err);
              return;
            }
            
            weatherImpactAnalytics.id = this.lastID;
            resolve(weatherImpactAnalytics);
          }
        );
      }
    });
  });
};

/**
 * Generate predictive model results
 * @param {string} modelName - Name of the model
 * @param {string} entityType - Type of entity (lead, customer, project)
 * @param {number} entityId - ID of the entity
 * @param {string} predictionType - Type of prediction
 * @returns {Promise} - Promise resolving to prediction result
 */
const generatePrediction = async (modelName, entityType, entityId, predictionType) => {
  return new Promise((resolve, reject) => {
    // Get entity data
    const entityTable = entityType + 's'; // leads, customers, projects
    
    db.get(`SELECT * FROM ${entityTable} WHERE id = ?`, [entityId], (err, entity) => {
      if (err) {
        console.error(`Error getting ${entityType} data:`, err);
        reject(err);
        return;
      }
      
      if (!entity) {
        reject(new Error(`${entityType} with ID ${entityId} not found`));
        return;
      }
      
      // Generate prediction based on model and entity type
      let predictionValue = 0;
      let confidenceScore = 0;
      let featuresUsed = {};
      let expirationDays = 30;
      
      switch (`${modelName}_${predictionType}`) {
        case 'lead_conversion_model_conversion_probability':
          // Get lead analytics
          db.get('SELECT * FROM lead_analytics WHERE lead_id = ?', [entityId], (err, leadAnalytics) => {
            if (err || !leadAnalytics) {
              // Generate a basic prediction without analytics
              predictionValue = Math.random() * 0.7 + 0.1; // 10% to 80%
              confidenceScore = 0.6; // 60% confidence
              featuresUsed = {
                'basic_lead_info': 1
              };
            } else {
              // Use lead analytics for better prediction
              predictionValue = leadAnalytics.conversion_probability;
              confidenceScore = 0.8; // 80% confidence
              featuresUsed = {
                'lead_score': 1,
                'acquisition_source': 1,
                'service_interest': 1
              };
            }
            
            savePrediction(modelName, entityType, entityId, predictionType, predictionValue, confidenceScore, featuresUsed, expirationDays)
              .then(resolve)
              .catch(reject);
          });
          break;
          
        case 'customer_churn_model_churn_probability':
          // Get customer analytics
          db.get('SELECT * FROM customer_analytics WHERE customer_id = ?', [entityId], (err, customerAnalytics) => {
            if (err || !customerAnalytics) {
              // Generate a basic prediction without analytics
              predictionValue = Math.random() * 0.4 + 0.1; // 10% to 50%
              confidenceScore = 0.6; // 60% confidence
              featuresUsed = {
                'basic_customer_info': 1
              };
            } else {
              // Use customer analytics for better prediction
              predictionValue = customerAnalytics.churn_probability;
              confidenceScore = 0.85; // 85% confidence
              featuresUsed = {
                'retention_score': 1,
                'project_count': 1,
                'lifetime_value': 1,
                'last_interaction_date': 1
              };
            }
            
            savePrediction(modelName, entityType, entityId, predictionType, predictionValue, confidenceScore, featuresUsed, expirationDays)
              .then(resolve)
              .catch(reject);
          });
          break;
          
        case 'project_cost_model_cost_overrun_probability':
          // Get project analytics
          db.get('SELECT * FROM project_analytics WHERE project_id = ?', [entityId], (err, projectAnalytics) => {
            if (err || !projectAnalytics) {
              // Generate a basic prediction without analytics
              predictionValue = Math.random() * 0.5 + 0.2; // 20% to 70%
              confidenceScore = 0.7; // 70% confidence
              featuresUsed = {
                'basic_project_info': 1
              };
            } else {
              // Use project analytics for better prediction
              predictionValue = projectAnalytics.cost_variance_percent > 0 ? 0.7 : 0.3;
              confidenceScore = 0.8; // 80% confidence
              featuresUsed = {
                'estimated_cost': 1,
                'project_type': 1,
                'historical_variance': 1
              };
            }
            
            savePrediction(modelName, entityType, entityId, predictionType, predictionValue, confidenceScore, featuresUsed, expirationDays)
              .then(resolve)
              .catch(reject);
          });
          break;
          
        default:
          // Generic prediction
          predictionValue = Math.random();
          confidenceScore = 0.5;
          featuresUsed = {
            'generic_features': 1
          };
          
          savePrediction(modelName, entityType, entityId, predictionType, predictionValue, confidenceScore, featuresUsed, expirationDays)
            .then(resolve)
            .catch(reject);
      }
    });
  });
};

/**
 * Save prediction to database
 * @param {string} modelName - Name of the model
 * @param {string} entityType - Type of entity
 * @param {number} entityId - ID of the entity
 * @param {string} predictionType - Type of prediction
 * @param {number} predictionValue - Prediction value
 * @param {number} confidenceScore - Confidence score
 * @param {Object} featuresUsed - Features used for prediction
 * @param {number} expirationDays - Days until prediction expires
 * @returns {Promise} - Promise resolving to saved prediction
 */
const savePrediction = (modelName, entityType, entityId, predictionType, predictionValue, confidenceScore, featuresUsed, expirationDays) => {
  return new Promise((resolve, reject) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    
    // Check if prediction already exists
    db.get(
      `SELECT id FROM predictive_model_results 
       WHERE model_name = ? AND entity_type = ? AND entity_id = ? AND prediction_type = ?`,
      [modelName, entityType, entityId, predictionType],
      (err, row) => {
        if (err) {
          console.error('Error checking prediction:', err);
          reject(err);
          return;
        }
        
        const prediction = {
          model_name: modelName,
          entity_type: entityType,
          entity_id: entityId,
          prediction_type: predictionType,
          prediction_value: predictionValue,
          confidence_score: confidenceScore,
          features_used: JSON.stringify(featuresUsed),
          prediction_date: new Date().toISOString(),
          expiration_date: expirationDate.toISOString()
        };
        
        if (row) {
          // Update existing prediction
          db.run(
            `UPDATE predictive_model_results 
             SET prediction_value = ?, confidence_score = ?, features_used = ?,
                 prediction_date = ?, expiration_date = ?
             WHERE id = ?`,
            [
              prediction.prediction_value,
              prediction.confidence_score,
              prediction.features_used,
              prediction.prediction_date,
              prediction.expiration_date,
              row.id
            ],
            function(err) {
              if (err) {
                console.error('Error updating prediction:', err);
                reject(err);
                return;
              }
              
              prediction.id = row.id;
              resolve(prediction);
            }
          );
        } else {
          // Insert new prediction
          db.run(
            `INSERT INTO predictive_model_results 
             (model_name, entity_type, entity_id, prediction_type,
              prediction_value, confidence_score, features_used,
              prediction_date, expiration_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              prediction.model_name,
              prediction.entity_type,
              prediction.entity_id,
              prediction.prediction_type,
              prediction.prediction_value,
              prediction.confidence_score,
              prediction.features_used,
              prediction.prediction_date,
              prediction.expiration_date
            ],
            function(err) {
              if (err) {
                console.error('Error inserting prediction:', err);
                reject(err);
                return;
              }
              
              prediction.id = this.lastID;
              resolve(prediction);
            }
          );
        }
      }
    );
  });
};

/**
 * Generate time-based aggregates for metrics
 * @param {string} metricName - Name of the metric
 * @param {string} aggregationLevel - Level of aggregation (daily, weekly, monthly, quarterly, yearly)
 * @returns {Promise} - Promise resolving to generated aggregates
 */
const generateTimeBasedAggregates = async (metricName, aggregationLevel) => {
  return new Promise((resolve, reject) => {
    // Determine date format and grouping based on aggregation level
    let dateFormat;
    let periodDays;
    
    switch (aggregationLevel) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        periodDays = 1;
        break;
      case 'weekly':
        dateFormat = '%Y-%W';
        periodDays = 7;
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        periodDays = 30;
        break;
      case 'quarterly':
        dateFormat = '%Y-Q%Q';
        periodDays = 90;
        break;
      case 'yearly':
        dateFormat = '%Y';
        periodDays = 365;
        break;
      default:
        reject(new Error(`Invalid aggregation level: ${aggregationLevel}`));
        return;
    }
    
    // Get raw data for the metric
    let query;
    let params = [];
    
    switch (metricName) {
      case 'revenue':
        query = `
          SELECT 
            strftime('${dateFormat}', end_date) as period,
            MIN(start_date) as period_start,
            MAX(end_date) as period_end,
            SUM(metric_value) as value
          FROM business_metrics
          WHERE metric_name = 'revenue'
          GROUP BY period
          ORDER BY period
        `;
        break;
        
      case 'profit':
        query = `
          SELECT 
            strftime('${dateFormat}', end_date) as period,
            MIN(start_date) as period_start,
            MAX(end_date) as period_end,
            SUM(metric_value) as value
          FROM business_metrics
          WHERE metric_name = 'profit'
          GROUP BY period
          ORDER BY period
        `;
        break;
        
      case 'leads':
        query = `
          SELECT 
            strftime('${dateFormat}', created_at) as period,
            MIN(created_at) as period_start,
            MAX(created_at) as period_end,
            COUNT(*) as value
          FROM leads
          GROUP BY period
          ORDER BY period
        `;
        break;
        
      case 'projects':
        query = `
          SELECT 
            strftime('${dateFormat}', created_at) as period,
            MIN(created_at) as period_start,
            MAX(created_at) as period_end,
            COUNT(*) as value
          FROM projects
          GROUP BY period
          ORDER BY period
        `;
        break;
        
      case 'lead_conversion_rate':
        query = `
          SELECT 
            strftime('${dateFormat}', conversion_date) as period,
            MIN(conversion_date) as period_start,
            MAX(conversion_date) as period_end,
            COUNT(CASE WHEN converted_to_customer = 1 THEN 1 END) * 100.0 / COUNT(*) as value
          FROM lead_analytics
          WHERE conversion_date IS NOT NULL
          GROUP BY period
          ORDER BY period
        `;
        break;
        
      case 'project_profit_margin':
        query = `
          SELECT 
            strftime('${dateFormat}', created_at) as period,
            MIN(created_at) as period_start,
            MAX(created_at) as period_end,
            AVG(profit_margin) * 100 as value
          FROM project_analytics
          GROUP BY period
          ORDER BY period
        `;
        break;
        
      default:
        reject(new Error(`Unsupported metric: ${metricName}`));
        return;
    }
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Error generating ${aggregationLevel} aggregates for ${metricName}:`, err);
        reject(err);
        return;
      }
      
      // Insert aggregates into time_based_aggregates table
      const aggregates = [];
      
      const insertPromises = rows.map(row => {
        return new Promise((resolve, reject) => {
          const aggregate = {
            metric_name: metricName,
            aggregation_level: aggregationLevel,
            period_start: row.period_start,
            period_end: row.period_end,
            value: row.value,
            dimension: null,
            dimension_value: null
          };
          
          db.run(
            `INSERT INTO time_based_aggregates 
             (metric_name, aggregation_level, period_start, period_end, value, dimension, dimension_value)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              aggregate.metric_name,
              aggregate.aggregation_level,
              aggregate.period_start,
              aggregate.period_end,
              aggregate.value,
              aggregate.dimension,
              aggregate.dimension_value
            ],
            function(err) {
              if (err) {
                console.error('Error inserting aggregate:', err);
                reject(err);
                return;
              }
              
              aggregate.id = this.lastID;
              aggregates.push(aggregate);
              resolve();
            }
          );
        });
      });
      
      Promise.all(insertPromises)
        .then(() => resolve(aggregates))
        .catch(reject);
    });
  });
};

/**
 * Process all data to generate analytics
 * @returns {Promise} - Promise resolving when all processing is complete
 */
const processAllData = async () => {
  try {
    // Process leads
    const leads = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM leads', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
    
    for (const lead of leads) {
      await processLeadData(lead);
    }
    
    // Process projects
    const projects = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM projects', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
    
    for (const project of projects) {
      await processProjectData(project);
    }
    
    // Process customers
    const customers = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM customers', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
    
    for (const customer of customers) {
      await processCustomerData(customer);
    }
    
    // Process weather events
    const weatherEvents = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM weather_events', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
    
    for (const weatherEvent of weatherEvents) {
      await processWeatherEventData(weatherEvent);
    }
    
    // Generate predictions for leads
    for (const lead of leads.slice(0, 10)) { // Process first 10 leads
      await generatePrediction('lead_conversion_model', 'lead', lead.id, 'conversion_probability');
    }
    
    // Generate predictions for customers
    for (const customer of customers.slice(0, 5)) { // Process first 5 customers
      await generatePrediction('customer_churn_model', 'customer', customer.id, 'churn_probability');
    }
    
    // Generate predictions for projects
    for (const project of projects.slice(0, 5)) { // Process first 5 projects
      await generatePrediction('project_cost_model', 'project', project.id, 'cost_overrun_probability');
    }
    
    // Generate time-based aggregates
    await generateTimeBasedAggregates('revenue', 'monthly');
    await generateTimeBasedAggregates('profit', 'monthly');
    await generateTimeBasedAggregates('leads', 'monthly');
    await generateTimeBasedAggregates('projects', 'monthly');
    await generateTimeBasedAggregates('lead_conversion_rate', 'monthly');
    await generateTimeBasedAggregates('project_profit_margin', 'monthly');
    
    return {
      leadsProcessed: leads.length,
      projectsProcessed: projects.length,
      customersProcessed: customers.length,
      weatherEventsProcessed: weatherEvents.length,
      predictionsGenerated: 10 + 5 + 5, // leads + customers + projects
      aggregatesGenerated: 6 // metrics
    };
  } catch (error) {
    console.error('Error processing all data:', error);
    throw error;
  }
};

module.exports = {
  processLeadData,
  processProjectData,
  processCustomerData,
  processWeatherEventData,
  generatePrediction,
  generateTimeBasedAggregates,
  processAllData
};