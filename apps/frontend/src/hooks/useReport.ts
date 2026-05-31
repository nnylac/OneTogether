import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = (import.meta.env.VITE_API_URL as string).replace('/api', '');
const BASE = import.meta.env.VITE_API_URL as string;

export interface DbReport {
  id: string;
  incidentId: string;
  title: string;
  content: string;
  status: 'draft' | 'finalized';
  version: number;
  createdBy: string;
  createdByName: string;
  finalizedBy?: string;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteCursor {
  userId: string;
  userName: string;
  position: number;
  color: string;
}

export interface AiSuggestion {
  selectedText: string;
  suggestion: string;
}

const USER_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
function colorFor(userId: string) {
  let h = 0; for (const c of userId) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return USER_COLORS[Math.abs(h) % USER_COLORS.length];
}

export function useReport(incidentId: string, userId: string, userName: string) {
  const [report, setReport] = useState<DbReport | null>(null);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myColor = colorFor(userId);

  // Load or create report via REST
  useEffect(() => {
    fetch(`${BASE}/incidents/${incidentId}/reports`, { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdBy: userId, createdByName: userName }),
    }).then(r => r.json()).then(setReport);
  }, [incidentId, userId, userName]);

  // WebSocket (reuse incident-room namespace)
  useEffect(() => {
    const socket = io(`${WS_URL}/incident-room`, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('report-updated', (p: { reportId: string; content: string; version: number; updatedBy: string }) => {
      setReport(prev => prev && prev.id === p.reportId ? { ...prev, content: p.content, version: p.version } : prev);
    });

    socket.on('report-cursor', (p: RemoteCursor & { reportId: string }) => {
      if (p.userId === userId) return;
      setCursors(prev => {
        const next = prev.filter(c => c.userId !== p.userId);
        return [...next, { userId: p.userId, userName: p.userName, position: p.position, color: p.color }];
      });
    });

    socket.on('report-finalized', (p: { reportId: string; finalizedBy: string }) => {
      setReport(prev => prev && prev.id === p.reportId ? { ...prev, status: 'finalized', finalizedBy: p.finalizedBy } : prev);
    });

    socket.on('report-ai-thinking', () => setAiThinking(true));
    socket.on('report-ai-suggestion', (p: AiSuggestion) => { setAiSuggestion(p); setAiThinking(false); });

    return () => { socket.disconnect(); };
  }, [incidentId, userId]);

  const updateContent = useCallback((content: string) => {
    setReport(prev => prev ? { ...prev, content } : prev);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!report) return;
      socketRef.current?.emit('report-update', { reportId: report.id, incidentId, content, userId, userName });
    }, 400);
  }, [report, incidentId, userId, userName]);

  const sendCursor = useCallback((position: number) => {
    if (!report) return;
    socketRef.current?.emit('report-cursor', { reportId: report.id, incidentId, userId, userName, position, color: myColor });
  }, [report, incidentId, userId, userName, myColor]);

  const finalize = useCallback(() => {
    if (!report) return;
    socketRef.current?.emit('report-finalize', { reportId: report.id, incidentId, userId, userName });
  }, [report, incidentId, userId, userName]);

  const requestAiSuggestion = useCallback((selectedText: string, question: string) => {
    if (!report) return;
    setAiThinking(true);
    socketRef.current?.emit('report-ai-suggest', {
      reportId: report.id, incidentId, selectedText, question, fullContent: report.content,
    });
  }, [report, incidentId]);

  const acceptSuggestion = useCallback((original: string, replacement: string) => {
    if (!report) return;
    const newContent = report.content.replace(original, replacement);
    updateContent(newContent);
    setAiSuggestion(null);
  }, [report, updateContent]);

  const updateTitle = useCallback(async (title: string) => {
    if (!report) return;
    await fetch(`${BASE}/incidents/${incidentId}/reports/${report.id}/title`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setReport(prev => prev ? { ...prev, title } : prev);
  }, [report, incidentId]);

  return {
    report, cursors, aiSuggestion, aiThinking, connected, myColor,
    updateContent, sendCursor, requestAiSuggestion,
    acceptSuggestion, dismissSuggestion: () => setAiSuggestion(null),
    updateTitle,
  };
}
