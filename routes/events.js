const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Audit = require('../models/Audit');
const { resolveIdentityWithPython } = require('../services/pythonResolver');
const { triggerDeterministicReplay } = require('../services/stateEngine');

router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    // 1. Payload Validation
    if (!payload.event_id || !payload.timestamp || !payload.agent_id || !payload.user_id || !payload.state_after || !payload.source_type) {
      return res.status(400).json({ error: "Malformed event payload. Missing required fields." });
    }

    const eventDate = new Date(payload.timestamp);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: "Invalid timestamp format provided." });
    }

    // Edge Case (a): Duplicate Event Check
    const existingEvent = await Event.findOne({ event_id: payload.event_id });
    if (existingEvent) {
      const isStateIdentical = JSON.stringify(existingEvent.state_after) === JSON.stringify(payload.state_after);
      if (isStateIdentical) {
        return res.status(200).json({
          status: "ignored",
          message: "Duplicate event detected with matching state. Processing skipped cleanly.",
          event_id: payload.event_id
        });
      } else {
        return res.status(409).json({
          error: "Conflicting duplicate event detected. Same event_id with different state_after payload."
        });
      }
    }

    // Edge Case (e): Conflicting Tool Calls Resolution via Priority Ordering
    let processedToolCalls = payload.tool_calls || [];
    if (processedToolCalls.length > 1) {
      processedToolCalls.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    }

    // Edge Case (d): Missing Prior State Inference
    let stateBefore = payload.state_before;
    if (!stateBefore || Object.keys(stateBefore).length === 0) {
      const latestPriorEvent = await Event.findOne({
        user_id: payload.user_id,
        timestamp: { $lt: eventDate }
      }).sort({ timestamp: -1 });

      stateBefore = latestPriorEvent ? latestPriorEvent.state_after : { status: "initialized", context: {} };
    }

    // Edge Case (b): Identity Conflict Detection & Resolution via Python
    const priorUserEvents = await Event.find({ user_id: payload.user_id }).limit(20);
    const identityResult = await resolveIdentityWithPython(payload, priorUserEvents);

    const resolvedSessionId = identityResult.resolved_session_id || payload.session_id || "default_session";

    // Build Final Event Record
    const newEvent = new Event({
      event_id: payload.event_id,
      timestamp: eventDate,
      agent_id: payload.agent_id,
      user_id: payload.user_id,
      session_id: resolvedSessionId,
      query: payload.query || "",
      tool_calls: processedToolCalls,
      response: payload.response || "",
      state_before: stateBefore,
      state_after: payload.state_after,
      source_type: payload.source_type
    });

    await newEvent.save();

    // Edge Case (c): Late Event Check & Replay Trigger
    const laterEventsCount = await Event.countDocuments({
      user_id: payload.user_id,
      timestamp: { $gt: eventDate }
    });

    let replayed = false;
    if (laterEventsCount > 0) {
      replayed = true;
      await triggerDeterministicReplay(eventDate, payload.user_id);
    }

    // Build Audit Log Output
    const auditRecord = new Audit({
      event_id: payload.event_id,
      decision_time: new Date(),
      evidence_used: {
        event_ids: [payload.event_id],
        timestamps: [eventDate],
        session_ids: [payload.session_id, resolvedSessionId].filter(Boolean)
      },
      identity_resolution: {
        resolved_user_id: payload.user_id,
        resolved_session_id: resolvedSessionId,
        confidence_score: identityResult.confidence_score,
        match_reason: identityResult.match_reason
      },
      state_final: newEvent.state_after,
      resolution_notes: replayed 
        ? "Late-arriving event ingested. State reconstruction triggered downstream replay successfully."
        : "Event state ingested and resolved in standard temporal sequence."
    });

    await auditRecord.save();

    return res.status(201).json({
      status: "success",
      event: newEvent,
      audit: auditRecord
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;