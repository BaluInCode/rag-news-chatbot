import React, { useEffect, useState, useRef } from 'react';
import Chat from './Chat';
import './styles.scss';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('sessionId', sid);
    }
    setSessionId(sid);
  }, []);

  return (
    <div className="app">
      <header><h1>News RAG Chatbot</h1></header>
      {sessionId && <Chat sessionId={sessionId} />}
    </div>
  );
}
export default App;
