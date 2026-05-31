import { CollaborativeReportEditor } from './CollaborativeReportEditor';
import { useReport } from '../../hooks/useReport';
import type { DbIncident, DbResourceAssignment, DbUpload } from '../../api/incidents.api';

interface Props {
  incident: DbIncident;
  currentUserId: string;
  currentUserName: string;
  resources: DbResourceAssignment[];
  uploads: DbUpload[];
  onUploaded: (upload: DbUpload) => void;
}

export function ReportsPanel({ incident, currentUserId, currentUserName, resources, uploads, onUploaded }: Props) {
  const rpt = useReport(incident.id, currentUserId, currentUserName);

  if (!rpt.report) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeReportEditor
      report={rpt.report}
      myColor={rpt.myColor}
      onContentChange={rpt.updateContent}
      onTitleChange={rpt.updateTitle}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      resources={resources}
      uploads={uploads}
      onUploaded={onUploaded}
    />
  );
}
