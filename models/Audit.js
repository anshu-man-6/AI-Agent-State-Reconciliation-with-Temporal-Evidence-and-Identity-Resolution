const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  event_id: { type: String, required: true, unique: true },
  decision_time: { type: Date, default: Date.now },
  evidence_used: {
    event_ids: [String],
    timestamps: [Date],
    session_ids: [String]
  },
  identity_resolution: {
    resolved_user_id: String,
    resolved_session_id: String,
    confidence_score: Number,
    match_reason: String
  },
  state_final: { type: Object, required: true },
  resolution_notes: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Audit', AuditSchema);