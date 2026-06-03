import ChatMessage from './ChatMessage';
import VoiceVisualizer from './VoiceVisualizer';

export default function ChatWindow({ messages, input, setInput, onSend, voiceState = 'idle', onToggleVoice }) {
  return (
    // h-screen এর বদলে h-full ব্যবহার করুন (কারণ এটি এখন একটি লেআউটের অংশ)
    <div className="flex flex-col h-full w-full bg-black text-green-500 font-mono overflow-hidden">
      
      {/* Voice Visualizer (KITT) */}
      <div className="shrink-0">
        <VoiceVisualizer state={voiceState} />
      </div>

      {/* মেসেজ লিস্ট - এটি বাকি জায়গা নেবে */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
      </div>
      
      {/* ইনপুট এরিয়া - এটি নিচে আটকে থাকবে */}
      <div className="shrink-0 flex gap-2 p-4 border-t border-green-900 bg-black">
        <button 
          onClick={onToggleVoice} 
          className={`px-4 py-2 border transition ${voiceState === 'listening' ? 'bg-red-900/50 border-red-600 text-red-500' : 'bg-gray-900/30 border-gray-600 text-gray-400'}`}
        >
          {voiceState === 'listening' ? '🛑' : '🎤'}
        </button>
        
        <input 
          className="flex-1 bg-gray-950 border border-green-700 p-2 text-green-400 outline-none focus:border-green-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command or click mic..."
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
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