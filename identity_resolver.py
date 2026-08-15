#!/usr/bin/env python3
import sys
import json
from datetime import datetime

def jaccard_similarity(str1, str2):
    """Calculates text overlap and entity containment between queries."""
    if not str1 or not str2:
        return 0.0
    
    words_a = set(str(str1).lower().split())
    words_b = set(str(str2).lower().split())
    
    if not words_a or not words_b:
        return 0.0
    
    intersection = words_a.intersection(words_b)
    union = words_a.union(words_b)
    
    jaccard_score = float(len(intersection)) / float(len(union))
    containment_score = float(len(intersection)) / min(len(words_a), len(words_b))
    
    return (0.4 * jaccard_score) + (0.6 * containment_score)

def temporal_proximity(ts1_str, ts2_str, max_window_seconds=3600):
    """Calculates temporal proximity normalized between 0.0 and 1.0."""
    try:
        t1 = datetime.fromisoformat(str(ts1_str).replace("Z", "+00:00"))
        t2 = datetime.fromisoformat(str(ts2_str).replace("Z", "+00:00"))
        delta = abs((t1 - t2).total_seconds())
        if delta >= max_window_seconds:
            return 0.0
        return 1.0 - (delta / max_window_seconds)
    except Exception:
        return 0.0

def resolve_identity(data):
    current = data.get("current_event", {})
    priors = data.get("prior_events", [])

    best_session = current.get("session_id")
    highest_score = 0.0
    match_notes = "No prior session overlap detected. Retaining provided session ID."

    for prior in priors:
        if prior.get("user_id") == current.get("user_id") and prior.get("session_id") != current.get("session_id"):
            text_sim = jaccard_similarity(current.get("query", ""), prior.get("query", ""))
            time_sim = temporal_proximity(current.get("timestamp", ""), prior.get("timestamp", ""))
            
            # Composite score: 60% text overlap, 40% time proximity
            score = (0.6 * text_sim) + (0.4 * time_sim)

            if score > highest_score and score >= 0.25:
                highest_score = score
                best_session = prior.get("session_id")
                match_notes = (
                    f"Resolved conflicting session {current.get('session_id')} to canonical session {best_session} "
                    f"due to contextual similarity ({text_sim:.2f}) and time proximity ({time_sim:.2f})."
                )

    return {
        "resolved_session_id": best_session,
        "confidence_score": round(highest_score, 4),
        "match_reason": match_notes
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if input_data:
            payload = json.loads(input_data)
            output = resolve_identity(payload)
            print(json.dumps(output))
        else:
            print(json.dumps({"error": "Empty input"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))