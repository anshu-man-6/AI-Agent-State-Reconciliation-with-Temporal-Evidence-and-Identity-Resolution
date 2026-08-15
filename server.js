const express = require('express');
const mongoose = require('mongoose');

const eventsRouter = require('./routes/events');
const replayRouter = require('./routes/replay');

const app = express();
app.use(express.json());

app.use('/events', eventsRouter);
app.use('/replay', replayRouter);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agent_reconciliation';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB.');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = app;