import { useParams } from 'react-router-dom';
import { useIncidentRoom } from '../hooks/useIncidentRoom';
import { IncidentRoomLayout } from '../components/incident-room/IncidentRoomLayout';

// Demo user — in a real system this comes from auth context
const DEMO_USER = { id: 'u-org', name: 'Chen Xiao Ling', role: 'organisation', org: 'scdf' };

export function IncidentRoomPage() {
  const { id } = useParams<{ id: string }>();

  const room = useIncidentRoom({
    incidentId: id ?? '',
    userId: DEMO_USER.id,
    userName: DEMO_USER.name,
    userRole: DEMO_USER.role,
  });

  return (
    <IncidentRoomLayout
      room={room}
      currentUserId={DEMO_USER.id}
      currentUserName={DEMO_USER.name}
      currentUserOrg={DEMO_USER.org}
    />
  );
}
