import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [replayState, setReplayState] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all ingested events and audits from API (or demo output)
  const fetchTimeline = async () => {
    setLoading(true);
    try {
      // In production, fetch directly from server endpoints
      const res = await fetch('/events/timeline'); 
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async (eventId) => {
    try {
      const res = await fetch(`/replay/${eventId}`);
      const data = await res.json();
      setReplayState(data);
    } catch (err) {
      console.error('Replay fetch failed:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>AI Agent State Reconciliation Dashboard</h1>
        <p>Temporal State Timeline, Conflict Resolution & Audit Trail</p>
      </header>

      <div className="main-content">
        {/* State Timeline Section */}
        <section className="timeline-section">
          <h2>Agent State History & Sequence</h2>
          <div className="timeline">
            {events.length === 0 ? (
              <p className="empty-msg">No state timeline data loaded. Run your backend server to view events.</p>
            ) : (
              events.map((ev, index) => (
                <div key={ev.event_id || index} className="timeline-card">
                  <div className="card-header">
                    <span className="badge event-id">{ev.event_id}</span>
                    <span className="badge timestamp">{new Date(ev.timestamp).toLocaleString()}</span>
                    <span className={`badge source ${ev.source_type}`}>{ev.source_type}</span>
                  </div>

                  <div className="card-body">
                    <p><strong>Query:</strong> "{ev.query}"</p>
                    <p><strong>Agent ID:</strong> {ev.agent_id} | <strong>User ID:</strong> {ev.user_id}</p>
                    <p><strong>Session ID:</strong> {ev.session_id}</p>
                    
                    <div className="state-box">
                      <strong>Reconstructed Final State:</strong>
                      <pre>{JSON.stringify(ev.state_after, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button onClick={() => setSelectedAudit(ev.audit)}>View Audit Trail</button>
                    <button onClick={() => handleReplay(ev.event_id)} className="btn-replay">Replay State</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Audit Log & Replay Details Pane */}
        <section className="detail-section">
          <h2>Resolution Audit & Replay Inspection</h2>
          
          {selectedAudit ? (
            <div className="audit-pane">
              <h3>Audit Trail for Event: <code>{selectedAudit.event_id}</code></h3>
              <p><strong>Decision Time:</strong> {new Date(selectedAudit.decision_time).toLocaleString()}</p>
              
              <h4>Identity Resolution Details:</h4>
              <ul>
                <li><strong>Resolved Session:</strong> {selectedAudit.identity_resolution?.resolved_session_id}</li>
                <li><strong>Confidence Score:</strong> {selectedAudit.identity_resolution?.confidence_score}</li>
                <li><strong>Matching Notes:</strong> {selectedAudit.identity_resolution?.match_reason}</li>
              </ul>

              <h4>Resolution Notes:</h4>
              <div className="notes-box">{selectedAudit.resolution_notes}</div>

              <h4>Final Reconciled State:</h4>
              <pre className="json-display">{JSON.stringify(selectedAudit.state_final, null, 2)}</pre>
            </div>
          ) : (
            <div className="placeholder-pane">Select an event from the timeline to view its audit trail.</div>
          )}

          {replayState && (
            <div className="replay-pane">
              <h3>Replay Verification Output: <code>{replayState.replayed_event_id}</code></h3>
              <p><strong>State Before Replay:</strong></p>
              <pre className="json-display">{JSON.stringify(replayState.state_before, null, 2)}</pre>
              <p><strong>Reconstructed State After Replay:</strong></p>
              <pre className="json-display">{JSON.stringify(replayState.reconstructed_state, null, 2)}</pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;