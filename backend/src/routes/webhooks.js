const express = require('express');
const router = express.Router();
const webhookProcessor = require('../services/webhookProcessor');

/**
 * Webhook Routes - Real-time updates from Sportmonks
 */

// Score update webhook
router.post('/livescore-update', async (req, res) => {
  try {
    if (!webhookProcessor.verifySignature(req)) {
      console.warn('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { data } = req.body;
    
    // Process asynchronously (don't block response)
    webhookProcessor.handleScoreUpdate(data).catch(err => {
      console.error('Async webhook error:', err);
    });

    // Return immediately (202 Accepted)
    res.status(202).json({ 
      status: 'accepted',
      fixture_id: data.fixture_id
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(202).json({ status: 'accepted' });
  }
});

// Match event webhook
router.post('/match-event', async (req, res) => {
  try {
    if (!webhookProcessor.verifySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { data } = req.body;
    
    webhookProcessor.handleMatchEvent(data).catch(err => {
      console.error('Async event error:', err);
    });

    res.status(202).json({ status: 'accepted' });

  } catch (error) {
    console.error('Event webhook error:', error);
    res.status(202).json({ status: 'accepted' });
  }
});

// Match status webhook
router.post('/match-status', async (req, res) => {
  try {
    if (!webhookProcessor.verifySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { data } = req.body;
    
    webhookProcessor.handleStatusChange(data).catch(err => {
      console.error('Async status error:', err);
    });

    res.status(202).json({ status: 'accepted' });

  } catch (error) {
    console.error('Status webhook error:', error);
    res.status(202).json({ status: 'accepted' });
  }
});

module.exports = router;
