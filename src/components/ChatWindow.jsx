import ChatMessage from './ChatMessage';
import VoiceVisualizer from './VoiceVisualizer';

export default function ChatWindow({ messages, input, setInput, onSend, voiceState = 'idle', onToggleVoice }) {
  return (
    <div className="flex flex-col h-screen bg-black text-green-500 p-4 font-mono">
      {/* Voice Visualizer (KITT) */}
      <VoiceVisualizer state={voiceState} />

      {/* মেসেজ লিস্ট */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
      </div>
      
      {/* ইনপুট এরিয়া */}
      <div className="flex gap-2 pt-4 border-t border-green-900">
        <button 
          onClick={onToggleVoice} 
          className={`px-4 py-2 border transition flex items-center justify-center ${voiceState === 'listening' ? 'bg-red-900/50 border-red-600 text-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'bg-gray-900/30 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
          title="Toggle Voice Mode"
        >
          {voiceState === 'listening' ? '🛑' : '🎤'}
        </button>
        <input 
          className="flex-1 bg-gray-950 border border-green-700 p-2 text-green-400 outline-none focus:border-green-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command or click mic..."
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
        />
        <button 
          onClick={onSend} 
          className="bg-green-900/30 border border-green-600 px-4 py-2 hover:bg-green-700 transition"
        >
          RUN
        </button>
      </div>
    </div>
  );
}