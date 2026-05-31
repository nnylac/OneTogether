import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Heading3, Minus, Sparkles, Download,
  X, Loader, CheckCircle2, ImageIcon,
} from 'lucide-react';
import type { DbReport } from '../../hooks/useReport';
import type { DbResourceAssignment, DbUpload } from '../../api/incidents.api';
import { uploadFile, getUploadUrl } from './UploadsPanel';

interface Props {
  report: DbReport;
  myColor: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  currentUserId: string;
  currentUserName: string;
  resources?: DbResourceAssignment[];
  uploads?: DbUpload[];
  onUploaded?: (upload: DbUpload) => void;
}

type AiMode = 'generate' | 'improve' | 'rephrase';

const AI_MODES: { id: AiMode; label: string; desc: string }[] = [
  { id: 'generate', label: 'Generate full report', desc: 'Write a complete incident report from all available context' },
  { id: 'improve', label: 'Improve existing', desc: 'Enhance structure, clarity and completeness of current content' },
  { id: 'rephrase', label: 'Rephrase & structure', desc: 'Reformat and restructure the content professionally' },
];

export function CollaborativeReportEditor({
  report, myColor, onContentChange, onTitleChange,
  currentUserId, currentUserName, resources = [], uploads = [], onUploaded,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRemoteContent = useRef(report.content);
  const isLocalUpdate = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(report.title);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [aiModal, setAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('generate');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Start writing your incident report...' }),
      Underline,
    ],
    content: report.content || '',
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-12 py-8 text-gray-800' },
    },
    onUpdate: ({ editor }) => {
      isLocalUpdate.current = true;
      const html = editor.getHTML();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onContentChange(html);
        isLocalUpdate.current = false;
      }, 400);
    },
  });

  useEffect(() => {
    if (!editor || !report) return;
    if (report.content !== lastRemoteContent.current && !isLocalUpdate.current) {
      if (report.content !== editor.getHTML()) {
        editor.commands.setContent(report.content || '');
        lastRemoteContent.current = report.content;
      }
    }
  }, [report.content, editor]);

  useEffect(() => { setTitle(report.title); }, [report.title]);

  const handleTitleBlur = useCallback(() => {
    if (title.trim() !== report.title) onTitleChange(title);
  }, [title, report.title, onTitleChange]);

  async function uploadAndInsertImage(file: File) {
    setUploadingImage(true);
    try {
      const upload = await uploadFile(report.incidentId, file, currentUserId);
      onUploaded?.(upload);
      editor?.chain().focus().setImage({ src: getUploadUrl(upload.url), alt: upload.originalName }).run();
    } catch { /* silently fail */ }
    finally { setUploadingImage(false); }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      e.preventDefault(); e.stopPropagation();
      setIsDragging(false);
      void uploadAndInsertImage(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setIsDragging(true); }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }

  async function handleAiGenerate() {
    setAiLoading(true); setAiError(null); setAiPreview(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/incidents/${report.incidentId}/reports/${report.id}/ai-generate`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: aiMode, currentContent: editor?.getHTML() ?? '' }),
        },
      );
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json() as { html: string };
      setAiPreview(data.html);
    } catch { setAiError('AI generation failed. Check your connection and try again.'); }
    finally { setAiLoading(false); }
  }

  function applyAiContent() {
    if (!aiPreview || !editor) return;
    editor.commands.setContent(aiPreview);
    onContentChange(aiPreview);
    setAiModal(false); setAiPreview(null);
  }

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 bg-white border-b border-gray-200 flex-wrap sticky top-0 z-10">
        <button title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btn(editor.isActive('heading', { level: 1 }))}><Heading1 size={14} /></button>
        <button title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive('heading', { level: 2 }))}><Heading2 size={14} /></button>
        <button title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive('heading', { level: 3 }))}><Heading3 size={14} /></button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}><Bold size={14} /></button>
        <button title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}><Italic size={14} /></button>
        <button title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn(editor.isActive('underline'))}><UnderlineIcon size={14} /></button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))}><List size={14} /></button>
        <button title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))}><ListOrdered size={14} /></button>
        <button title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btn(false)}><Minus size={14} /></button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button title="Insert image" onClick={() => fileInputRef.current?.click()} className={btn(false)}>
          <ImageIcon size={14} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAndInsertImage(f); }} />

        <div className="ml-auto flex items-center gap-2">
          {uploadingImage && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader size={11} className="animate-spin" /> Uploading...
            </span>
          )}
          {report.status === 'finalized' && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded font-semibold">Finalized</span>
          )}
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            title={currentUserName} style={{ backgroundColor: myColor }}>
            {currentUserName.charAt(0).toUpperCase()}
          </div>
          <button onClick={() => { setAiModal(true); setAiPreview(null); setAiError(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded transition-colors">
            <Sparkles size={12} /> AI Report
          </button>
          <button onClick={() => window.print()} title="Export PDF"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-12 pt-8 pb-2 border-b border-gray-100">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur}
          placeholder="Report title"
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent" />
      </div>

      {/* Editor area */}
      <div
        className={`flex-1 overflow-y-auto relative ${isDragging ? 'ring-2 ring-inset ring-indigo-400 bg-indigo-50/30' : ''}`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white border-2 border-dashed border-indigo-400 rounded-xl px-8 py-4 text-sm text-indigo-600 font-semibold shadow-lg">
              Drop image to insert
            </div>
          </div>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* AI Report Modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-500" /> AI Report Generator
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Context: {resources.length} resources &middot; {uploads.length} uploads
                </p>
              </div>
              <button onClick={() => setAiModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
            </div>

            {!aiPreview && !aiLoading && (
              <div className="p-5 space-y-3 flex-1 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-1">What would you like to do?</p>
                {AI_MODES.map((m) => (
                  <label key={m.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      aiMode === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <input type="radio" name="aiMode" value={m.id} checked={aiMode === m.id}
                      onChange={() => setAiMode(m.id)} className="mt-0.5 accent-indigo-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                ))}
                {aiError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{aiError}</div>}
              </div>
            )}

            {aiLoading && (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader size={24} className="text-indigo-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Generating report from incident context...</p>
                </div>
              </div>
            )}

            {aiPreview && !aiLoading && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2 bg-green-50 border-b border-green-200 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-xs text-green-700 font-semibold">Report generated - review before applying</span>
                </div>
                <div className="p-6 prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: aiPreview }} />
              </div>
            )}

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              {!aiPreview && !aiLoading && (
                <>
                  <button onClick={() => setAiModal(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => void handleAiGenerate()}
                    className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors flex items-center gap-2">
                    <Sparkles size={14} /> Generate
                  </button>
                </>
              )}
              {aiPreview && !aiLoading && (
                <>
                  <button onClick={() => { setAiPreview(null); setAiError(null); }}
                    className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                    Regenerate
                  </button>
                  <button onClick={applyAiContent}
                    className="text-sm font-semibold bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors flex items-center gap-2">
                    <CheckCircle2 size={14} /> Apply to Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0;
        }
        .ProseMirror h1 { font-size: 1.7rem; font-weight: 700; margin: 1.4rem 0 0.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.4rem; }
        .ProseMirror h2 { font-size: 1.3rem; font-weight: 600; margin: 1.2rem 0 0.4rem; }
        .ProseMirror h3 { font-size: 1.05rem; font-weight: 600; margin: 1rem 0 0.3rem; }
        .ProseMirror ul { list-style: disc; padding-left: 1.4rem; margin: 0.3rem 0; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.4rem; margin: 0.3rem 0; }
        .ProseMirror li { margin: 0.15rem 0; }
        .ProseMirror blockquote { border-left: 3px solid #6366f1; padding: 0.3rem 0.8rem; color: #6b7280; background: #f5f3ff; margin: 0.4rem 0; }
        .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.75rem 0; }
        .ProseMirror code { background: #f3f4f6; color: #1d4ed8; padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-size: 0.85em; font-family: monospace; }
        .ProseMirror pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.4rem; padding: 0.7rem 1rem; overflow-x: auto; margin: 0.6rem 0; }
        .ProseMirror pre code { background: none; padding: 0; }
        @media print {
          .ProseMirror h1 { font-size: 1.7rem; font-weight: 700; }
          .ProseMirror h2 { font-size: 1.3rem; font-weight: 600; }
          .ProseMirror h3 { font-size: 1.05rem; font-weight: 600; }
        }
      `}</style>
    </div>
  );
}
