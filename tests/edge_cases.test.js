const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Event = require('../models/Event');
const Audit = require('../models/Audit');
const fixtures = require('../fixtures/sample_events.json');

describe('AI Agent State Reconciliation Platform Test Suite', () => {

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/agent_reconciliation_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Event.deleteMany({});
    await Audit.deleteMany({});
  });

  test('Edge Case (a): Duplicate event should be idempotent', async () => {
    const firstCall = await request(app).post('/events').send(fixtures[0]);
    expect(firstCall.status).toBe(201);

    const secondCall = await request(app).post('/events').send(fixtures[1]);
    expect(secondCall.status).toBe(200);
    expect(secondCall.body.status).toBe('ignored');
  });

  test('Edge Case (d) & (e): Inferred state_before and tool call priority sorting', async () => {
    await request(app).post('/events').send(fixtures[0]);
    
    const res = await request(app).post('/events').send(fixtures[2]);
    expect(res.status).toBe(201);
    expect(res.body.event.state_before.stage).toBe('search');
    expect(res.body.event.tool_calls[0].tool_name).toBe('charge_credit_card');
  });

  test('Edge Case (b): Identity conflict resolution using Python IPC', async () => {
    // Seed initial session event (sess_001)
    await request(app).post('/events').send(fixtures[0]);
    
    // Post conflicting session ID event (sess_999)
    const res = await request(app).post('/events').send(fixtures[3]);
    expect(res.status).toBe(201);
    expect(res.body.audit.identity_resolution.resolved_session_id).toBe('sess_001');
  });

  test('Edge Case (c): Late event triggers deterministic replay', async () => {
    await request(app).post('/events').send(fixtures[0]);
    await request(app).post('/events').send(fixtures[2]);

    const lateRes = await request(app).post('/events').send(fixtures[4]);
    expect(lateRes.status).toBe(201);
    expect(lateRes.body.audit.resolution_notes).toContain('reconstruction triggered downstream replay');

    const replayedEvt102 = await Event.findOne({ event_id: 'evt_102' });
    expect(replayedEvt102.state_after.meal).toBe('vegetarian');
  });

  test('Replayable API GET /replay/:event_id returns identical output', async () => {
    await request(app).post('/events').send(fixtures[0]);
    
    const replayRes = await request(app).post('/events').send(fixtures[2]);
    const eventId = replayRes.body.event.event_id;

    const res1 = await request(app).get(`/replay/${eventId}`);
    const res2 = await request(app).get(`/replay/${eventId}`);

    expect(res1.status).toBe(200);
    expect(res1.body).toEqual(res2.body);
  });
});