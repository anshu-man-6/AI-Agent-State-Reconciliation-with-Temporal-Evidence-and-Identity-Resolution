const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Audit = require('../models/Audit');

router.get('/:event_id', async (req, res) => {
  try {
    const { event_id } = req.params;

    const eventRecord = await Event.findOne({ event_id });
    if (!eventRecord) {
      return res.status(404).json({ error: `Event with ID '${event_id}' not found.` });
    }

    const auditRecord = await Audit.findOne({ event_id });

    return res.status(200).json({
      replayed_event_id: eventRecord.event_id,
      timestamp: eventRecord.timestamp,
      reconstructed_state: eventRecord.state_after,
      state_before: eventRecord.state_before,
      audit_trail: auditRecord
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;