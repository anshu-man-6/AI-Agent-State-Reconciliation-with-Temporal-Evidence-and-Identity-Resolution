const mongoose = require('mongoose');

const ToolCallSchema = new mongoose.Schema({
  tool_name: { type: String, required: true },
  action: { type: String, required: true },
  priority: { type: Number, default: 99 } // Low numbers indicate higher execution priority
}, { _id: false });

const EventSchema = new mongoose.Schema({
  event_id: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  agent_id: { type: String, required: true },
  user_id: { type: String, required: true },
  session_id: { type: String, required: true },
  query: { type: String, default: "" },
  tool_calls: [ToolCallSchema],
  response: { type: String, default: "" },
  state_before: { type: Object, default: null },
  state_after: { type: Object, required: true },
  source_type: { type: String, enum: ["real-time", "offline"], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);