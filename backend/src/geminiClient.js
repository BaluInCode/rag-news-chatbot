import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function callGemini(messages, stream=false) {
  // Example pseudocode — replace with actual Gemini API call & streaming protocol
  const url = 'https://generative.googleapis.com/v1beta2/models/gemini-x:generateText'; // example
  const resp = await axios.post(url, {
    // payload structure depends on Gemini API spec
    inputs: messages
  }, {
    headers: { 'Authorization': `Bearer ${GEMINI_API_KEY}` }
  });
  return resp.data; // adapt to returned structure
}
