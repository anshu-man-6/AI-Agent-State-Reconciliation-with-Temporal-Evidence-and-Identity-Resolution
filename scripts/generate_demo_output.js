const fs = require('fs');
const path = require('path');
const fixtures = require('../fixtures/sample_events.json');

const API_BASE = 'http://localhost:3000';

async function generateDemoOutput() {
  console.log('🚀 Generating Demo Output from Fixture Events...\n');
  const results = [];

  for (const event of fixtures) {
    console.log(`Processing Event ID: ${event.event_id} (${event._comment || ''})...`);
    
    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      const json = await response.json();
      results.push({
        input_event_id: event.event_id,
        http_status: response.status,
        api_response: json
      });
    } catch (err) {
      console.error(`Failed to process event ${event.event_id}:`, err.message);
    }
  }

  // Also fetch replay state for the key event (evt_102) to verify replayability
  console.log('\nFetching Replay state for evt_102...');
  try {
    const replayRes = await fetch(`${API_BASE}/replay/evt_102`);
    const replayJson = await replayRes.json();
    results.push({
      replay_test: {
        target_event_id: "evt_102",
        replay_response: replayJson
      }
    });
  } catch (err) {
    console.error('Failed to fetch replay:', err.message);
  }

  const outputPath = path.join(__dirname, '../demo_output.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Demo output successfully saved to: ${outputPath}`);
}

generateDemoOutput();