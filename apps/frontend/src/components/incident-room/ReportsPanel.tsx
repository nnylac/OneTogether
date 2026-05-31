import { CollaborativeReportEditor } from './CollaborativeReportEditor';
import { useReport } from '../../hooks/useReport';
import type { DbIncident } from '../../api/incidents.api';

interface Props {
  incident: DbIncident;
  currentUserId: string;
  currentUserName: string;
}

export function ReportsPanel({ incident, currentUserId, currentUserName }: Props) {
  const rpt = useReport(incident.id, currentUserId, currentUserName);

  if (!rpt.report) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading report…</p>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeReportEditor
      report={rpt.report}
      cursors={rpt.cursors}
      aiSuggestion={rpt.aiSuggestion}
      aiThinking={rpt.aiThinking}
      myColor={rpt.myColor}
      onContentChange={rpt.updateContent}
      onCursorMove={rpt.sendCursor}
      onAiRequest={rpt.requestAiSuggestion}
      onAiAccept={rpt.acceptSuggestion}
      onAiDismiss={rpt.dismissSuggestion}
      onTitleChange={rpt.updateTitle}
      currentUserName={currentUserName}
    />
  );
}
