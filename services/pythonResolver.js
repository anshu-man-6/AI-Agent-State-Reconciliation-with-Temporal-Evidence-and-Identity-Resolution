const { spawn } = require('child_process');
const path = require('path');

function resolveIdentityWithPython(currentEvent, priorEvents) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '../identity_resolver.py');
    
    // Windows typically uses 'python', Unix uses 'python3'
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pyProcess = spawn(pythonCmd, [scriptPath]);

    let output = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => { output += data.toString(); });
    pyProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pyProcess.on('error', (err) => {
      // Fallback if binary isn't found
      return resolve({
        resolved_session_id: currentEvent.session_id,
        confidence_score: 0.0,
        match_reason: `Failed to spawn Python process: ${err.message}`
      });
    });

    pyProcess.on('close', (code) => {
      if (code !== 0 || !output) {
        return resolve({
          resolved_session_id: currentEvent.session_id,
          confidence_score: 0.0,
          match_reason: `Python execution fallback: ${errorOutput || 'Default session retained.'}`
        });
      }
      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (e) {
        resolve({
          resolved_session_id: currentEvent.session_id,
          confidence_score: 0.0,
          match_reason: 'Failed to parse identity resolution JSON output.'
        });
      }
    });

    // Format ISO string dates for MongoDB Documents
    const formattedPriors = priorEvents.map(p => {
      const obj = p.toObject ? p.toObject() : { ...p };
      if (obj.timestamp && typeof obj.timestamp.toISOString === 'function') {
        obj.timestamp = obj.timestamp.toISOString();
      }
      return obj;
    });

    const payload = JSON.stringify({ current_event: currentEvent, prior_events: formattedPriors });
    pyProcess.stdin.write(payload);
    pyProcess.stdin.end();
  });
}

module.exports = { resolveIdentityWithPython };