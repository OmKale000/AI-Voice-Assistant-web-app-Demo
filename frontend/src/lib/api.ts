import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BACKEND_URL,
});

export const checkHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const fetchHistory = async () => {
  const res = await api.get('/api/history');
  return res.data;
};

export const fetchSessionHistory = async (sessionId: string) => {
  const res = await api.get(`/api/history/${sessionId}`);
  return res.data;
};

export const fetchAnalytics = async () => {
  const res = await api.get('/api/analytics');
  return res.data;
};

export const processAudio = async (
  audioBlob: Blob,
  chatHistory: any[],
  sessionId: string,
  imageFile?: File
) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('chat_history', JSON.stringify(chatHistory));
  formData.append('session_id', sessionId);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const res = await api.post('/api/process-audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob', // Expecting audio response
  });
  
  return {
    audioBlob: res.data,
    headers: res.headers,
  };
};

export const streamText = async (query: string, chatHistory: any[], onChunk: (chunk: string) => void) => {
  const formData = new URLSearchParams();
  formData.append('query', query);
  formData.append('chat_history', JSON.stringify(chatHistory));

  const response = await fetch(`${BACKEND_URL}/api/stream-text`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }
};
