import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../navbar/main-navbar';
import CategoryTag from '../category-tag/category-tag';

import '../ui.css';
import './notifications.css';

type NotificationKind = 'request' | 'session' | 'confirmed' | 'rejected';
type Filter = 'all' | NotificationKind;
type UserMode = 'student' | 'volunteer';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  actorName: string;
  message: string;
  category: string;
  title: string;
  dateLabel: string;
  path: string;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'request', label: 'Support Requests' },
  { value: 'session', label: 'Support Sessions' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
];

// TODO: replace with this user's notifications from Firestore
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    kind: 'request',
    actorName: 'Student Name',
    message: 'has sent you a Support Request!',
    category: 'General Student Support',
    title: 'Help Me do Advanced Maths (fec101)',
    dateLabel: '11 Aug 2025',
    path: '/requests/n1',
  },
  {
    id: 'n2',
    kind: 'session',
    actorName: 'Volunteer Name',
    message: 'has accepted your Support Session!',
    category: 'General Student Support',
    title: 'Coffee Making Helper',
    dateLabel: '24 Apr 2026',
    path: '/sessions/n2',
  },
  {
    id: 'n3',
    kind: 'session',
    actorName: 'Student Name',
    message: 'has sent a feedback!',
    category: 'General Student Support',
    title: 'Fix my Laptop plz',
    dateLabel: '24 Apr 2026',
    path: '/sessions/n3',
  },
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'No notifications yet',
  request: 'No support request notifications',
  session: 'No support session notifications',
  confirmed: 'No confirmed notifications',
  rejected: 'No rejected notifications',
};

interface NotificationCardProps {
  item: NotificationItem;
  onOpen: () => void;
}

function NotificationCard({ item, onOpen }: NotificationCardProps) {
  return (
    <li>
      <button type="button" className="notif-card" onClick={onOpen}>
        <p className="notif-card-message">
          <strong>{item.actorName}</strong> {item.message}
        </p>
        <CategoryTag>{item.category}</CategoryTag>
        <span className="notif-card-row">
          <span className="notif-card-title">{item.title}</span>
          <span className="notif-card-date">{item.dateLabel}</span>
        </span>
      </button>
    </li>
  );
}

export default function NotificationsPage({ mode }: { mode: UserMode }) {
  const navigate = useNavigate();
  const dashboardPath = mode === 'volunteer' ? '/volunteer/dashboard' : '/student/dashboard';
  const backgroundClass = mode === 'volunteer'
    ? 'ui-page-volunteer-background'
    : 'ui-page-student-background';
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () => (filter === 'all' ? MOCK_NOTIFICATIONS : MOCK_NOTIFICATIONS.filter(n => n.kind === filter)),
    [filter],
  );

  return (
    <div className="ui-page">
      <Navbar dashboardPath={dashboardPath} />

      <main className={`${backgroundClass} notif-background`}>
        <div className="notif-main">
          <header className="notif-banner">
            <h1 className="notif-banner-title">Notifications</h1>
            <p className="notif-banner-subtitle">Always stay updated !</p>
          </header>

          <div className="notif-filters" role="group" aria-label="Filter notifications">
            {FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                className="notif-filter"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="notif-list" aria-live="polite">
            {visible.map(item => (
              <NotificationCard key={item.id} item={item} onOpen={() => navigate(item.path)} />
            ))}
            {visible.length === 0 && <li className="notif-empty">{EMPTY_MESSAGES[filter]}</li>}
          </ul>
        </div>
      </main>
    </div>
  );
}
