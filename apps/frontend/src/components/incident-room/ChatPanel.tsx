import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Bot, ChevronDown } from 'lucide-react';
import type { DbChatMessage } from '../../api/incidents.api';
import { MessageBubble } from './MessageBubble';

const AI_COMMANDS = [
  { label: '@ai /generate-report', desc: 'Full SITREP for this incident' },
  { label: '@ai /summarize', desc: 'Quick executive summary' },
  { label: '@ai /suggest-next-steps', desc: 'Prioritised action list' },
  { label: '@ai /resource-status', desc: 'Resource deployment analysis' },
];

interface Props {
  messages: DbChatMessage[];
  typingUsers: { userId: string; userName: string }[];
  aiThinking: boolean;
  currentUserId: string;
  onSend: (content: string) => void;
  onTyping: () => void;
}

export function ChatPanel({ messages, typingUsers, aiThinking, currentUserId, onSend, onTyping }: Props) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking, atBottom]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 50);
  }

  function handleInput(value: string) {
    setInput(value);
    const lower = value.toLowerCase();
    setShowSuggestions(lower.startsWith('@ai') || lower.startsWith('/'));
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(onTyping, 300);
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    setShowSuggestions(false);
    setAtBottom(true);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function applySuggestion(label: string) {
    setInput(label + ' ');
    setShowSuggestions(false);
  }

  const allTyping = [
    ...typingUsers.filter((u) => u.userId !== currentUserId).map((u) => u.userName),
    ...(aiThinking ? ['AI'] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            No messages yet. Use <span className="font-mono text-blue-500">@ai</span> to call the AI assistant.
          </div>
        )}
        {messages.map((m) => <MessageBubble key={m.id} message={m} currentUserId={currentUserId} />)}
        {aiThinking && (
          <div className="flex gap-3 my-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!atBottom && (
        <button onClick={() => { setAtBottom(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          className="absolute bottom-24 right-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-1.5 shadow-lg">
          <ChevronDown size={16} />
        </button>
      )}

      {allTyping.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-400">
          {allTyping.join(', ')} {allTyping.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {showSuggestions && (
        <div className="mx-4 mb-1 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
          {AI_COMMANDS.map((cmd) => (
            <button key={cmd.label} onClick={() => applySuggestion(cmd.label)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
              <Bot size={14} className="text-blue-500 shrink-0" />
              <span className="text-sm font-mono text-blue-600">{cmd.label}</span>
              <span className="text-xs text-gray-400 ml-1">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-gray-200 flex gap-2 items-end">
        <textarea value={input} onChange={(e) => handleInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Message... or type @ai for AI commands" rows={1}
          className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 max-h-32"
          style={{ fieldSizing: 'content' } as React.CSSProperties} />
        <button onClick={handleSend} disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl p-2 transition-colors">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
