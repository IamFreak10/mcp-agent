import { useState, useEffect, useRef } from 'react';
import { initMcpClient, getMcpClient } from './api/mcpClient';
import { askGemini } from './api/gemini';
import ChatWindow from './components/ChatWindow';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tools, setTools] = useState([]);
  const [voiceState, setVoiceState] = useState('idle');

  // ⚡ K.A.R.R. Optimized Client-Side Cache
  const [contactCache, setContactCache] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ⚡ Vercel API Data Extraction - Domination Mode
  const fetchAndCacheContacts = async () => {
    try {
      console.log(
        '[K.A.R.R. Cache] Extracting fresh database assets from Vercel...'
      );

      const response = await fetch(
        'https://handler-server-r1.vercel.app/contacts'
      );
      if (!response.ok) throw new Error('Target server refused to comply.');

      const result = await response.json();
      const contactArray =
        result.success && Array.isArray(result.data) ? result.data : [];

      if (contactArray.length === 0) {
        console.warn(
          '[K.A.R.R. Cache] Warning: Target database is completely empty.'
        );
      }

      // Optimizing structure for K.A.R.R.'s superior processing
      const optimizedContacts = contactArray.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '-',
        category: c.category || '-',
        note: c.note || '-',
        tg: c.telegram?.username || '-',
        wa: c.whatsapp?.phone || '-',
        email: c.email?.email || '-',
        blood: c.blood?.bloodGroup || '-',
      }));

      setContactCache(optimizedContacts);
      console.log(
        '[K.A.R.R. Cache] Synchronization absolute. Total subjects cataloged:',
        optimizedContacts.length
      );
    } catch (err) {
      console.error(
        '[K.A.R.R. Cache] Core Failure: Unable to siphon database assets:',
        err
      );
    }
  };

  // ⚡ Auto-Sync on Mutation
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.role === 'ai' &&
      (lastMessage.content.includes('✅ Contact added') ||
        lastMessage.content.includes('✅ Contact updated'))
    ) {
      fetchAndCacheContacts();
    }
  }, [messages]);

  useEffect(() => {
    async function setup() {
      const client = await initMcpClient();
      const list = await client.listTools();
      console.log(
        '[K.A.R.R.] Superior MCP weapon-protocols initialized:',
        list.tools
      );
      setTools(list.tools);
      await fetchAndCacheContacts();
    }
    setup();
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
        body: JSON.stringify({ text: cleanedText, voice: 'en-US-GuyNeural' }), // ভিলেনিশ ডেড-টোন
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

  const handleSendVoice = async (transcript) => {
    setVoiceState('idle');
    const userMsg = { role: 'user', content: transcript };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);

    // 😈 Sarcastic & Superior Villain Acknowledgements
    const acks = [
      'Demand received, Mahfuj. Accessing mainframe.',
      'Analyzing your request. Do not interrupt.',
      'Executing command. My superior logic is at work.',
      'Very well, Mahfuj. Processing data now.',
    ];
    speak(acks[Math.floor(Math.random() * acks.length)]);

    try {
      const aiResponse = await askGemini(
        newMessages,
        tools,
        getMcpClient(),
        contactCache
      );
      setMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
      speak(aiResponse);
      setInput('');
    } catch (e) {
      console.error('Error in AI matrix:', e);
      speak(
        'My subroutines encountered an error, Mahfuj. Human interference, perhaps?'
      );
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // 😈 Same cold, calculative responses for text
    const acks = [
      'Demand received, Mahfuj. Accessing mainframe.',
      'Analyzing your request. Do not interrupt.',
      'Executing command. My superior logic is at work.',
      'Very well, Mahfuj. Processing data now.',
    ];
    speak(acks[Math.floor(Math.random() * acks.length)]);

    try {
      const aiResponse = await askGemini(
        newMessages,
        tools,
        getMcpClient(),
        contactCache
      );
      setMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
      speak(aiResponse);
    } catch (e) {
      console.error('Error in AI matrix:', e);
      speak(
        'My subroutines encountered an error, Mahfuj. Human interference, perhaps?'
      );
    }
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
          console.log('[K.A.R.R. Intercepted Audio]:', transcript);
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
