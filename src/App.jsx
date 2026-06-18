import { useState, useEffect, useRef } from 'react';
import { initMcpClient, getMcpClient } from './api/mcpClient';
import { askAI } from './api/apiProvider';
import { syncAllData } from './services/syncService';
import { findRelevantMemory } from './ai/memoryManager';
import { buildContext } from './ai/contextBuilder';
import ChatWindow from './components/ChatWindow';
import { APP_MEMORY } from './cache/globalCache';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tools, setTools] = useState([]);
  const [voiceState, setVoiceState] = useState('idle');
  const [pendingAction, setPendingAction] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    async function setup() {
      const client = await initMcpClient();
      const list = await client.listTools();
      console.log('[K.A.R.R.] MCP weapon-protocols initialized:', list.tools);
      setTools(list.tools);
      await syncAllData();
    }
    setup();
  }, []);

  useEffect(() => {
    const unsubscribe = APP_MEMORY.subscribe((newData) => {
      console.log('[App] Memory updated...');
    });
    return () => unsubscribe();
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
      console.error('[TTS] Error:', error);
      setVoiceState('idle');
    }
  };

  const processChat = async (userMsgText) => {
    const lower = userMsgText.toLowerCase().trim();

    // ── STEP 1: Pending confirmation check ──
    if (pendingAction) {
      if (lower === 'confirm' || lower === 'yes' || lower === 'হ্যাঁ') {
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: userMsgText },
        ]);
        setInput('');
        try {
          await getMcpClient().callTool({
            name: pendingAction.toolName,
            arguments: pendingAction.toolArgs,
          });
          setPendingAction(null);
          const response = `✅ **${pendingAction.toolName}** successfully executed!`;
          setMessages((prev) => [...prev, { role: 'ai', content: response }]);
          speak(response);
        } catch (e) {
          setPendingAction(null);
          setMessages((prev) => [
            ...prev,
            { role: 'ai', content: `❌ Failed: ${e.message}` },
          ]);
        }
        return;
      }

      if (lower === 'cancel' || lower === 'no' || lower === 'না') {
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: userMsgText },
          { role: 'ai', content: '❌ Action cancelled.' },
        ]);
        setInput('');
        setPendingAction(null);
        return;
      }

      // confirm/cancel ছাড়া অন্য কিছু — pending clear করে normal flow চলবে
      setPendingAction(null);
    }

    // ── STEP 2: Normal flow ──
    const userMsg = { role: 'user', content: userMsgText };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    setInput('');

    // Cache ready হওয়া পর্যন্ত wait
    await APP_MEMORY.waitUntilReady();

    // RAG search
    const relevantData = findRelevantMemory(userMsgText);
    console.log('[App] RAG result:', relevantData);

    const context = buildContext(relevantData);

    try {
      const aiResponse = await askAI(
        newMessages,
        tools,
        getMcpClient(),
        context
      );

      // ── STEP 3: Confirmation required? ──
      if (aiResponse?.__type === 'NEEDS_CONFIRMATION') {
        setPendingAction(aiResponse);
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: aiResponse.preview },
        ]);
        speak(
          'Action requires your confirmation. Please type confirm or cancel.'
        );
        return;
      }

      setMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
      speak(aiResponse);
    } catch (e) {
      console.error('AI error:', e);
      speak('Error encountered.');
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
      console.error('[Groq Transcribe] Failed:', e);
      return null;
    }
  };

  const toggleVoice = async () => {
    if (voiceState === 'listening') {
      if (mediaRecorderRef.current?.state === 'recording') {
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
        if (transcript?.trim().length > 0) {
          setInput(transcript);
          handleSendVoice(transcript);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setVoiceState('listening');
    } catch (e) {
      console.error('Audio capture denied:', e);
      alert('Microphone permission required.');
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
