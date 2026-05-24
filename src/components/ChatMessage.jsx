import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div 
        className={`max-w-[85%] p-4 rounded-lg font-mono text-sm border tracking-wide leading-relaxed
        ${isUser 
          ? 'bg-green-950/20 border-green-700 text-green-200' 
          : 'bg-zinc-950 border-green-900 text-zinc-100' // AI-এর ব্যাকগ্রাউন্ড ও বডি টেক্সট হালকা সাদা করলাম পড়ার সুবিধার জন্য
        }`}
      >
        {/* টপ লেবেল */}
        <span className={`block text-[10px] font-bold tracking-widest opacity-60 mb-2 
          ${isUser ? 'text-green-400' : 'text-amber-500'}`}
        >
          {isUser ? '// USER_COMMAND' : '// SYSTEM_RESPONSE'}
        </span>

        {/* মার্কডাউন পার্সার দিয়ে কাস্টম স্টাইল */}
        <div className="prose prose-invert max-w-none text-sm markdown-content">
          <ReactMarkdown
            components={{
              // ### হেডিংগুলোকে সুন্দর গোল্ডেন/হলুদ কালার দেবে এবং ওপরে-নিচে স্পেস তৈরি করবে
              h3: ({ node, ...props }) => <h3 className="text-amber-400 text-base font-bold mt-4 mb-2 border-b border-zinc-800 pb-1" {...props} />,
              
              // **bold** লেখাগুলোকে উজ্জ্বল সবুজ করবে
              strong: ({ node, ...props }) => <strong className="text-green-400 font-semibold" {...props} />,
              
              // লিংকগুলোকে নীল কালার করবে এবং ক্লিকেবল বানাবে
              a: ({ node, ...props }) => <a className="text-cyan-400 underline hover:text-cyan-300 transition" target="_blank" rel="noreferrer" {...props} />,
              
              // প্যারাগ্রাফের মাঝে গ্যাপ তৈরি করবে
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-zinc-300" {...props} />,
              
              // অনুভূমিক রেখা (---) সুন্দর ড্যাশড বর্ডার তৈরি করবে
              hr: () => <hr className="border-t border-dashed border-zinc-800 my-4" />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}