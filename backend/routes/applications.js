// Import the authentication middleware
const requireLogin = require('../middleware/authMiddleware');

// Import Express router
const express = require('express');
const router = express.Router();

// Import the database connection
const pool = require('../db');

// GET /api/applications - Get all applications for a user
router.get('/', requireLogin, async (request, response) => {
  try {
    // For now, get user_id from query parameter (?user_id=1)
    // Later, this will come from the logged-in session
    // Get the user ID from the logged-in session (not from the URL)
const userId = request.session.user.id;

const result = await pool.query(
  'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
  [userId]
);

    // Send back the jobs
    response.json({
      success: true,
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    response.status(500).json({
      error: 'Failed to fetch applications',
    });
  }
});

// POST /api/applications - Create a new application
router.post('/', requireLogin, async (request, response) => {
  try {
    // Get the data from the request body
    const { company, position, date_applied, notes, follow_up_date } = request.body;

    // Get user_id from the logged-in session
    const user_id = request.session.user.id;

    // Validate: Are all required fields provided?
    if (!user_id || !company || !position || !date_applied) {
      return response.status(400).json({
        error: 'Missing required fields: user_id, company, position, date_applied',
      });
    }

    // Insert the new application into the database
    const result = await pool.query(
      'INSERT INTO applications (user_id, company, position, date_applied, notes, follow_up_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id, company, position, date_applied, notes || null, follow_up_date || null, 'Applied']
    );

    // Send back the newly created application
    response.status(201).json({
      success: true,
      message: 'Application created',
      application: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating application:', error);
    response.status(500).json({
      error: 'Failed to create application',
    });
  }
});

// PUT /api/applications/:id - Update an application
router.put('/:id', requireLogin, async (request, response) => {
  try {
    // Get the ID from the URL
    const { id } = request.params;

    // Get user_id from the logged-in session
    const user_id = request.session.user.id;

    // Get the data they want to update
    const { company, position, status, date_applied, notes, follow_up_date } = request.body;

    // Build the UPDATE query dynamically (only update fields that were sent)
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (company !== undefined) {
      updates.push(`company = $${valueIndex++}`);
      values.push(company);
    }
    if (position !== undefined) {
      updates.push(`position = $${valueIndex++}`);
      values.push(position);
    }
    if (status !== undefined) {
      updates.push(`status = $${valueIndex++}`);
      values.push(status);
    }
    if (date_applied !== undefined) {
      updates.push(`date_applied = $${valueIndex++}`);
      values.push(date_applied);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${valueIndex++}`);
      values.push(notes);
    }
    if (follow_up_date !== undefined) {
      updates.push(`follow_up_date = $${valueIndex++}`);
      values.push(follow_up_date);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    // Check: Did they send any fields to update?
    if (updates.length === 1) { // Only updated_at, nothing else
      return response.status(400).json({
        error: 'No fields to update',
      });
    }

    // Add the ID to the values
    values.push(id);

    // Build the full query
    const query = `UPDATE applications SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`;

    // Run the query
    const result = await pool.query(query, values);

    // Check: Did the application exist?
    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'Application not found',
      });
    }

    // Send back the updated application
    response.json({
      success: true,
      message: 'Application updated',
      application: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating application:', error);
    response.status(500).json({
      error: 'Failed to update application',
    });
  }
});

// DELETE /api/applications/:id - Delete an application
router.delete('/:id', requireLogin, async (request, response) => {
  try {
    // Get the ID from the URL
    const { id } = request.params;

    // Get user_id from the logged-in session
    const user_id = request.session.user.id;

    // Delete the application from the database
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 RETURNING *',
      [id]
    );

    // Check: Did the application exist?
    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'Application not found',
      });
    }

    // Send back a success message
    response.json({
      success: true,
      message: 'Application deleted',
      deletedApplication: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    response.status(500).json({
      error: 'Failed to delete application',
    });
  }
});

// Export the router so server.js can use it
module.exports = router;