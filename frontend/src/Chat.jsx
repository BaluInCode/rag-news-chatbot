import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Chat({ sessionId }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const backend = process.env.REACT_APP_BACKEND || 'http://localhost:4000';

  useEffect(() => {
    fetchHistory();
  }, [sessionId]);

  async function fetchHistory() {
    const resp = await axios.get(`${backend}/history/${sessionId}`);
    setHistory(resp.data.history || []);
  }

  async function send() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const resp = await axios.post(`${backend}/chat`, { sessionId, message: input });
      // append both user and assistant to UI
      setHistory(h => [...h, { role: 'user', content: input }, { role: 'assistant', content: resp.data.answer }]);
      setInput('');
    } catch (e) {
      alert('Error sending: ' + (e?.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  async function resetSession() {
    await axios.post(`${backend}/reset/${sessionId}`);
    setHistory([]);
    // generate new session optionally:
    const newSid = sessionId; // or new one via parent
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {history.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="controls">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the news..." />
        <button onClick={send} disabled={loading}>{loading ? '...' : 'Send'}</button>
        <button onClick={resetSession}>Reset</button>
      </div>
    </div>
  );
}
