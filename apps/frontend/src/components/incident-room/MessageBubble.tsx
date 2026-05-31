import type { DbChatMessage } from '../../api/incidents.api';

interface Props { message: DbChatMessage; currentUserId: string; }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
}

function AiContent({ content, command }: { content: string; command?: string }) {
  const lines = content.split('\n');
  return (
    <div className="text-sm space-y-1">
      {command && (
        <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-1 font-mono">
          /{command}
        </span>
      )}
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-blue-500 mt-0.5">&bull;</span>
              <span dangerouslySetInnerHTML={{ __html: bold.replace(/^[-•]\s*/, '') }} />
            </div>
          );
        }
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-blue-500 font-mono text-xs mt-0.5 w-5 shrink-0">{line.match(/^(\d+)\./)?.[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: bold.replace(/^\d+\.\s*/, '') }} />
            </div>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
      })}
    </div>
  );
}

export function MessageBubble({ message, currentUserId }: Props) {
  const isOwn = message.senderId === currentUserId;
  const isAi = message.isAi;

  if (isAi) {
    return (
      <div className="flex gap-3 my-2">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600">AI Assistant</span>
            <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-gray-700">
            <AiContent content={message.content} command={message.aiCommand ?? undefined} />
          </div>
        </div>
      </div>
    );
  }

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 my-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
          <span className="text-xs font-medium text-gray-500">You</span>
        </div>
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-sm text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 my-1">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-gray-600 text-xs font-semibold">{message.senderName.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-700">{message.senderName}</span>
          {message.senderRole && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{message.senderRole}</span>
          )}
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
        </div>
        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 max-w-sm text-sm">
          {message.content}
        </div>
      </div>
    </div>
  );
}
