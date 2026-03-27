const express = require('express');
const router = express.Router();
const livescoreService = require('../services/livescoreService');

/**
 * Livescore Routes - RCB vs SRH IPL match
 */

// GET /api/livescore/match - Returns live/upcoming RCB vs SRH match data
router.get('/match', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await livescoreService.getMatch();
    const elapsed = Date.now() - startTime;

    res.json({
      ...result,
      response_time_ms: elapsed
    });

  } catch (error) {
    console.error('❌ Error in /api/livescore/match:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// GET /api/livescore/teams - Returns RCB and SRH team information
router.get('/teams', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await livescoreService.getTeams();
    const elapsed = Date.now() - startTime;

    res.json({
      ...result,
      response_time_ms: elapsed
    });

  } catch (error) {
    console.error('❌ Error in /api/livescore/teams:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

module.exports = router;
