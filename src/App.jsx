import { useState, useEffect, useRef } from 'react';
import { initMcpClient, getMcpClient } from './api/mcpClient';
import { askAI } from './api/apiProvider';
import { syncAllData } from './services/syncService'; // নতুন সার্ভিস ইম্পোর্ট
import { findRelevantMemory } from './ai/memoryManager'; // মেমোরি সার্চ
import { buildContext } from './ai/contextBuilder'; // কন্টেক্সট বিল্ডার[cite: 2]
import ChatWindow from './components/ChatWindow';
import { APP_MEMORY } from './cache/globalCache';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tools, setTools] = useState([]);
  const [voiceState, setVoiceState] = useState('idle');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ⚡ অ্যাপ চালু হওয়ার সময় সব ডেটা সিনক হবে[cite: 2]
  useEffect(() => {
    async function setup() {
      const client = await initMcpClient();
      const list = await client.listTools();
      console.log('[K.A.R.R.] MCP weapon-protocols initialized:', list.tools);
      setTools(list.tools);

      await syncAllData(); // ডেটা ব্যাকগ্রাউন্ডে সিনক হচ্ছে[cite: 2]
    }
    setup();
  }, []);

  // মেমোরি সাবস্ক্রাইব করার জন্য নতুন useEffect
  useEffect(() => {
    // মেমোরি আপডেট হলে এটি কল হবে
    const unsubscribe = APP_MEMORY.subscribe((newData) => {
      console.log('[App] Memory updated, triggering UI refresh if needed...');
      // এখানে প্রয়োজনে একটি স্টেট আপডেট করে রি-রেন্ডার করতে পারো
      // setMemoryVersion((prev) => prev + 1);
    });

    return () => unsubscribe(); // ক্লিনআপ ফাংশন
  }, []);

  const speak = async (text) => {
    if (!text) return;
    setVoiceState('speaking');

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    let cleanedText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~]/g, '')
      .trim();

    if (!cleanedText) {
      setVoiceState('idle');
      return;
    }
    if (cleanedText.length > 500) cleanedText = cleanedText.substring(0, 500);

    try {
      const response = await fetch('http://localhost:5050/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText, voice: 'en-US-GuyNeural' }),
      });

      if (!response.ok) {
        setVoiceState('idle');
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('[K.A.R.R. TTS] Vocalizer system failure:', error);
      setVoiceState('idle');
    }
  };

  // ⚡ স্মার্ট হ্যান্ডলার: মেমোরি সার্চ ও কনটেক্সট ইনজেকশন[cite: 2]
  // App.jsx এর ভেতরে processChat ফাংশনটি এভাবে পরিবর্তন করো:
  const processChat = async (userMsgText) => {
    // ১. নিশ্চিত করো মেমোরি রেডি (অপশনাল: syncAllData যদি চলমান থাকে)
    const userMsg = { role: 'user', content: userMsgText };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    setInput('');

    // ২. মেমোরি থেকে রিলেভেন্ট তথ্য খোঁজা
    // এখানে ডিলে বা চেক যোগ করা ভালো যদি syncAllData বড় হয়
    const relevantData = findRelevantMemory(userMsgText);

    // DEBUG: মেমোরি চেক করো এখানে
    console.log('[DEBUG] Memory found:', relevantData);

    const context = buildContext(relevantData);
    console.log('[DEBUG] Built Context:', context); // লগ চেক করো কি আসছে

    try {
      const aiResponse = await askAI(
        newMessages,
        tools,
        getMcpClient(),
        context
      );
      setMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
      speak(aiResponse);
    } catch (e) {
      console.error('Error in AI matrix:', e);
      speak('My subroutines encountered an error, Mahfuj.');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await processChat(input);
  };

  const handleSendVoice = async (transcript) => {
    setVoiceState('idle');
    await processChat(transcript);
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-large-v3-turbo');

      const res = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      return data.text;
    } catch (e) {
      console.error('[Groq Intercept] Interception failed:', e);
      return null;
    }
  };

  const toggleVoice = async () => {
    if (voiceState === 'listening') {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        mediaRecorderRef.current.stop();
        setVoiceState('idle');
      }
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());

        const transcript = await transcribeAudio(audioBlob);
        if (transcript && transcript.trim().length > 0) {
          setInput(transcript);
          handleSendVoice(transcript);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setVoiceState('listening');
    } catch (e) {
      console.error('Audio capture denied:', e);
      alert('Microphone lock engaged. K.A.R.R. demands browser permission.');
    }
  };

  return (
    <ChatWindow
      messages={messages}
      input={input}
      setInput={setInput}
      onSend={handleSend}
      voiceState={voiceState}
      onToggleVoice={toggleVoice}
    />
  );
}

export default App;
