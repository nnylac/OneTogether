import { useState, useRef, useCallback, type KeyboardEvent, useEffect } from 'react';
import {
  Bold, Italic, List, CheckSquare, Heading1, Heading2, Heading3,
  Code, Minus, Sparkles, CheckCircle2, X, Loader, Download,
} from 'lucide-react';
import type { RemoteCursor, AiSuggestion, DbReport } from '../../hooks/useReport';

// ── Shared document styles (used by both overlay preview and print) ────────
const DOC_FONT = `font-family: 'Inter', system-ui, -apple-system, sans-serif`;
const DOC_SIZE = 'font-size: 15px';
const DOC_LINE = 'line-height: 1.8';
const DOC_PAD  = 'padding: 3rem 3.5rem';

// ── Markdown → HTML renderer ───────────────────────────────────────────────
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre class="md-pre"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="md-check checked"><span class="cb">✓</span>$1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="md-check"><span class="cb">○</span>$1</li>')
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="md-bq">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="md-hr" />')
    .replace(/\n\n+/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br />');

  html = html
    .replace(/(<li class="md-li">.*?<\/li>)/gs, '<ul class="md-ul">$1</ul>')
    .replace(/(<li class="md-oli">.*?<\/li>)/gs, '<ol class="md-ol">$1</ol>')
    .replace(/(<li class="md-check[^>]*>.*?<\/li>)/gs, '<ul class="md-checklist">$1</ul>');

  return `<p class="md-p">${html}</p>`;
}

const PREVIEW_CSS = `
  .md-h1{font-size:1.7rem;font-weight:700;color:#111827;margin:1.4rem 0 .5rem;border-bottom:1px solid #e5e7eb;padding-bottom:.4rem}
  .md-h2{font-size:1.3rem;font-weight:600;color:#1f2937;margin:1.2rem 0 .4rem}
  .md-h3{font-size:1.05rem;font-weight:600;color:#374151;margin:1rem 0 .3rem}
  .md-p{color:#374151;line-height:1.8;margin:.3rem 0;min-height:1em}
  .md-pre{background:#f9fafb;border:1px solid #e5e7eb;border-radius:.4rem;padding:.7rem 1rem;overflow-x:auto;margin:.6rem 0}
  .md-pre code{color:#1d4ed8;font-size:.85rem;font-family:monospace}
  .md-code{background:#f3f4f6;color:#1d4ed8;padding:.1rem .3rem;border-radius:.2rem;font-size:.85em;font-family:monospace}
  .md-ul,.md-ol{padding-left:1.4rem;margin:.3rem 0;color:#374151}
  .md-li,.md-oli{margin:.15rem 0}
  .md-checklist{list-style:none;padding-left:.4rem;margin:.3rem 0}
  .md-check{display:flex;align-items:center;gap:.5rem;color:#374151;margin:.15rem 0}
  .md-check.checked{color:#059669}
  .cb{font-size:.75rem;width:1rem;text-align:center;font-weight:600}
  .md-bq{border-left:3px solid #6366f1;padding:.3rem .8rem;color:#6b7280;background:#f5f3ff;margin:.4rem 0;border-radius:0 .25rem .25rem 0}
  .md-hr{border:none;border-top:1px solid #e5e7eb;margin:1rem 0}
`;

// ── Cursor overlay (mirror-div technique) ─────────────────────────────────
function CursorOverlay({ cursors, textareaRef }: {
  cursors: RemoteCursor[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [positions, setPositions] = useState<{ cursor: RemoteCursor; top: number; left: number }[]>([]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || cursors.length === 0) { setPositions([]); return; }
    const style = window.getComputedStyle(ta);
    const mirror = document.createElement('div');
    Object.assign(mirror.style, {
      position: 'absolute', visibility: 'hidden', pointerEvents: 'none',
      overflow: 'auto', width: `${ta.offsetWidth}px`,
      font: style.font, lineHeight: style.lineHeight,
      padding: style.padding, border: style.border,
      whiteSpace: 'pre-wrap', wordWrap: 'break-word',
    });
    document.body.appendChild(mirror);
    const computed = cursors.map(cursor => {
      mirror.textContent = ta.value.substring(0, cursor.position);
      const span = document.createElement('span');
      span.textContent = '|';
      mirror.appendChild(span);
      const rect = span.getBoundingClientRect();
      const taRect = ta.getBoundingClientRect();
      return { cursor, top: rect.top - taRect.top + ta.scrollTop, left: rect.left - taRect.left };
    });
    document.body.removeChild(mirror);
    setPositions(computed);
  }, [cursors, textareaRef]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {positions.map(({ cursor, top, left }) => (
        <div key={cursor.userId} style={{ position: 'absolute', top, left }}>
          <div style={{ width: 2, height: 20, backgroundColor: cursor.color }} />
          <div style={{ backgroundColor: cursor.color, position: 'absolute', top: -18, left: 0 }}
            className="px-1 py-0.5 text-white text-[9px] font-semibold rounded whitespace-nowrap">
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AI Selection Panel ─────────────────────────────────────────────────────
const AI_PRESETS = [
  { label: 'Improve', q: 'Improve the clarity and professionalism of this section.' },
  { label: 'Expand', q: 'Expand this section with more operational detail.' },
  { label: 'Summarise', q: 'Make this more concise without losing key information.' },
  { label: 'Fix grammar', q: 'Fix any grammar and spelling issues.' },
];

function AiSelectionPanel({ selection, aiSuggestion, aiThinking, onRequest, onAccept, onDismiss }: {
  selection: { text: string } | null;
  aiSuggestion: AiSuggestion | null;
  aiThinking: boolean;
  onRequest: (text: string, question: string) => void;
  onAccept: (original: string, replacement: string) => void;
  onDismiss: () => void;
}) {
  const [question, setQuestion] = useState('');
  if (!selection && !aiSuggestion && !aiThinking) return null;

  return (
    <div className="w-64 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
          <Sparkles size={12} />AI Assistant
        </span>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      {selection && !aiSuggestion && !aiThinking && (
        <div className="p-3 space-y-3 overflow-y-auto">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Selected text</p>
            <p className="text-xs text-gray-600 bg-indigo-50 rounded p-2 line-clamp-3 border border-indigo-100 italic">
              "{selection.text}"
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AI_PRESETS.map(p => (
              <button key={p.label} onClick={() => onRequest(selection.text, p.q)}
                className="text-xs bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 px-2 py-1 rounded border border-gray-200 hover:border-indigo-200 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Or ask anything about this section…" rows={2}
              className="w-full text-xs bg-gray-50 text-gray-700 rounded px-2 py-1.5 resize-none border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-gray-400" />
            <button onClick={() => { if (question.trim()) onRequest(selection.text, question); }}
              disabled={!question.trim()}
              className="mt-1.5 w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-1.5 rounded transition-colors">
              Ask AI
            </button>
          </div>
        </div>
      )}
      {aiThinking && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center"><Loader size={18} className="text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400">Generating…</p></div>
        </div>
      )}
      {aiSuggestion && !aiThinking && (
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Original</p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded p-2 line-clamp-3 border border-gray-100 line-through italic">{aiSuggestion.selectedText}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Suggestion</p>
            <p className="text-xs text-gray-700 bg-indigo-50 rounded p-2 border border-indigo-100 whitespace-pre-wrap">{aiSuggestion.suggestion}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onAccept(aiSuggestion.selectedText, aiSuggestion.suggestion)}
              className="flex-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white py-1.5 rounded flex items-center justify-center gap-1 transition-colors">
              <CheckCircle2 size={11} />Accept
            </button>
            <button onClick={onDismiss} className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 py-1.5 rounded transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────
function insertAtCursor(ta: HTMLTextAreaElement, before: string, after = '') {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.substring(s, e);
  const val = ta.value.substring(0, s) + before + sel + after + ta.value.substring(e);
  return { value: val, pos: s + before.length + sel.length + after.length };
}
function linePrefix(ta: HTMLTextAreaElement, prefix: string) {
  const s = ta.selectionStart;
  const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
  const val = ta.value.substring(0, ls) + prefix + ta.value.substring(ls);
  return { value: val, pos: s + prefix.length };
}

function Toolbar({ onInsert, onExportPdf, currentUserName, cursors, myColor }: {
  onInsert: (patch: { value: string; pos: number }) => void;
  onExportPdf: () => void;
  currentUserName: string;
  cursors: RemoteCursor[];
  myColor: string;
}) {
  function withTA(fn: (ta: HTMLTextAreaElement) => { value: string; pos: number }) {
    const ta = document.activeElement as HTMLTextAreaElement;
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    onInsert(fn(ta));
  }
  const btn = (icon: React.ReactNode, title: string, action: () => void) => (
    <button title={title} onClick={action}
      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-white border-b border-gray-200 flex-wrap sticky top-0 z-10">
      {btn(<Heading1 size={14} />, 'Heading 1', () => withTA(ta => linePrefix(ta, '# ')))}
      {btn(<Heading2 size={14} />, 'Heading 2', () => withTA(ta => linePrefix(ta, '## ')))}
      {btn(<Heading3 size={14} />, 'Heading 3', () => withTA(ta => linePrefix(ta, '### ')))}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {btn(<Bold size={14} />, 'Bold', () => withTA(ta => insertAtCursor(ta, '**', '**')))}
      {btn(<Italic size={14} />, 'Italic', () => withTA(ta => insertAtCursor(ta, '*', '*')))}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {btn(<List size={14} />, 'Bullet list', () => withTA(ta => linePrefix(ta, '- ')))}
      {btn(<CheckSquare size={14} />, 'Checklist', () => withTA(ta => linePrefix(ta, '- [ ] ')))}
      {btn(<Code size={14} />, 'Code block', () => withTA(ta => insertAtCursor(ta, '\n```\n', '\n```\n')))}
      {btn(<Minus size={14} />, 'Divider', () => withTA(ta => insertAtCursor(ta, '\n---\n')))}

      {/* Collaborators + export on right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Collaborator avatars */}
        <div className="flex -space-x-1">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white"
            title={currentUserName} style={{ backgroundColor: myColor }}>
            {currentUserName.charAt(0).toUpperCase()}
          </div>
          {cursors.map(c => (
            <div key={c.userId} title={c.userName}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white"
              style={{ backgroundColor: c.color }}>
              {c.userName.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <button onClick={onExportPdf}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded transition-colors">
          <Download size={12} />Export PDF
        </button>
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────
interface Props {
  report: DbReport;
  cursors: RemoteCursor[];
  aiSuggestion: AiSuggestion | null;
  aiThinking: boolean;
  myColor: string;
  onContentChange: (v: string) => void;
  onCursorMove: (pos: number) => void;
  onAiRequest: (text: string, question: string) => void;
  onAiAccept: (original: string, replacement: string) => void;
  onAiDismiss: () => void;
  onTitleChange: (t: string) => void;
  currentUserName: string;
}

export function CollaborativeReportEditor({
  report, cursors, aiSuggestion, aiThinking, myColor,
  onContentChange, onCursorMove, onAiRequest, onAiAccept, onAiDismiss,
  onTitleChange, currentUserName,
}: Props) {
  const [selection, setSelection] = useState<{ text: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(report.title);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hasAiPanel = selection || aiSuggestion || aiThinking;

  function handleSelect() {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (e > s) setSelection({ text: ta.value.substring(s, e) });
    else if (!aiSuggestion) setSelection(null);
    onCursorMove(ta.selectionStart);
  }

  function applyInsert(patch: { value: string; pos: number }) {
    onContentChange(patch.value);
    setTimeout(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = patch.pos;
    }, 0);
  }

  function handleExportPdf() {
    window.print();
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .report-printable, .report-printable * { visibility: visible !important; }
          .report-printable { position: fixed !important; inset: 0 !important; padding: 2cm !important; background: white !important; }
          ${PREVIEW_CSS}
          .md-h1{color:#000}.md-h2{color:#111}.md-h3{color:#222}.md-p{color:#333}
        }
        ${PREVIEW_CSS}
      `}</style>

      <div className="h-full flex flex-col overflow-hidden bg-gray-100">
        {/* Toolbar */}
        <Toolbar
          onInsert={applyInsert}
          onExportPdf={handleExportPdf}
          currentUserName={currentUserName}
          cursors={cursors}
          myColor={myColor}
        />

        {/* Selection AI hint bar */}
        {selection && !aiSuggestion && !aiThinking && (
          <div className="px-4 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 shrink-0 bg-white">
            <Sparkles size={11} className="text-indigo-500" />
            <span className="text-xs text-indigo-700">"{selection.text.slice(0, 40)}{selection.text.length > 40 ? '…' : ''}" selected</span>
            <button onClick={() => {/* keep selection, panel will open */}}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 ml-1">
              Ask AI →
            </button>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Document + overlay */}
          <div className="flex-1 overflow-y-auto">
            {/* White document card */}
            <div className="max-w-3xl mx-auto my-8 bg-white shadow-md report-printable" style={{ minHeight: 800 }}>
              {/* Document title */}
              <div className="px-14 pt-10 pb-4 border-b border-gray-100">
                {editingTitle ? (
                  <input autoFocus value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onBlur={() => { onTitleChange(titleDraft); setEditingTitle(false); }}
                    onKeyDown={e => e.key === 'Enter' && (onTitleChange(titleDraft), setEditingTitle(false))}
                    className="w-full text-2xl font-bold text-gray-900 border-none outline-none bg-transparent border-b-2 border-indigo-400"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                ) : (
                  <h1 onClick={() => setEditingTitle(true)}
                    className="text-2xl font-bold text-gray-900 cursor-text hover:text-indigo-800 transition-colors"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {report.title || 'Untitled Report'}
                  </h1>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {report.status === 'finalized'
                    ? `Finalized by ${report.finalizedBy}`
                    : `Draft · v${report.version} · Click title to rename`}
                </p>
              </div>

              {/* Editing surface — overlay technique */}
              <div className="relative" style={{ minHeight: 600 }}>
                {/* Preview layer (rendered markdown, pointer-events: none) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 15,
                    lineHeight: 1.8,
                    padding: '2.5rem 3.5rem',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: report.content ? renderMarkdown(report.content) : '' }}
                />

                {/* Textarea layer (transparent text, visible caret) */}
                <textarea
                  ref={taRef}
                  value={report.content}
                  onChange={e => onContentChange(e.target.value)}
                  onSelect={handleSelect}
                  onMouseUp={handleSelect}
                  onKeyUp={e => onCursorMove((e.target as HTMLTextAreaElement).selectionStart)}
                  placeholder="Start writing your incident report…&#10;&#10;Use the toolbar above for headings, lists, and formatting.&#10;Select any text and use AI to improve sections."
                  className="relative w-full bg-transparent resize-none focus:outline-none placeholder-gray-300"
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 15,
                    lineHeight: 1.8,
                    padding: '2.5rem 3.5rem',
                    color: 'transparent',
                    caretColor: myColor,
                    minHeight: 600,
                    zIndex: 10,
                  }}
                />

                {/* Cursor overlay for remote users */}
                <CursorOverlay cursors={cursors} textareaRef={taRef} />
              </div>
            </div>
          </div>

          {/* AI Panel */}
          {hasAiPanel && (
            <AiSelectionPanel
              selection={selection}
              aiSuggestion={aiSuggestion}
              aiThinking={aiThinking}
              onRequest={onAiRequest}
              onAccept={onAiAccept}
              onDismiss={() => { onAiDismiss(); setSelection(null); }}
            />
          )}
        </div>
      </div>
    </>
  );
}
