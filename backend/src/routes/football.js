const express = require('express');
const router = express.Router();
const scoreService = require('../services/scoreService');

/**
 * Football Routes - Real-time football scores
 * With OPTIMIZED caching (15s TTL)
 */

// Get all live football scores
router.get('/live', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const result = await scoreService.getLiveFootballScores();

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    res.json({
      ...result,
      total_response_time_ms: totalTime
    });

  } catch (error) {
    console.error('Error fetching football scores:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Get specific match details
router.get('/match/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    
    const [details, events] = await Promise.all([
      scoreService.getMatchDetails(fixtureId, 'football'),
      scoreService.getMatchEvents(fixtureId)
    ]);

    res.json({
      success: true,
      data: {
        fixture_id: fixtureId,
        sport: 'football',
        details: details.data,
        events: events,
        source: details.source
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching match details:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
