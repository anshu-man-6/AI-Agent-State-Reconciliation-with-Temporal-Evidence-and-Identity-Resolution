const Event = require('../models/Event');

/**
 * Deterministically recalculates agent state from a specific timestamp forward.
 * Called when a late-arriving event alters prior history.
 */
async function triggerDeterministicReplay(fromTimestamp, user_id) {
  const eventsSequence = await Event.find({
    user_id,
    timestamp: { $gte: new Date(fromTimestamp) }
  }).sort({ timestamp: 1 });

  if (eventsSequence.length === 0) return;

  // Find the state immediately preceding this sequence
  const priorEvent = await Event.findOne({
    user_id,
    timestamp: { $lt: new Date(fromTimestamp) }
  }).sort({ timestamp: -1 });

  let currentState = priorEvent ? JSON.parse(JSON.stringify(priorEvent.state_after)) : {};

  for (const ev of eventsSequence) {
    ev.state_before = { ...currentState };
    // Apply state mutations deterministically
    currentState = { ...currentState, ...ev.state_after };
    ev.state_after = { ...currentState };
    await ev.save();
  }
}

module.exports = { triggerDeterministicReplay };