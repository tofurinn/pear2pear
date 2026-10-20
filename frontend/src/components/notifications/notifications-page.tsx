import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/authContext';
import { markNotificationAsRead, subscribeToNotificationsByUser } from '../../services/NotificationService';
import type { Notification as AppNotification, NotificationKind } from '../../types/Notification';
import Navbar from '../navbar/main-navbar';
import CategoryTag from '../category-tag/category-tag';

import '../ui.css';
import './notifications.css';

type Filter = 'all' | NotificationKind;
type UserMode = 'student' | 'volunteer';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'request', label: 'Support Requests' },
  { value: 'session', label: 'Support Sessions' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'No notifications yet',
  request: 'No support request notifications',
  session: 'No support session notifications',
  confirmed: 'No confirmed notifications',
  rejected: 'No rejected notifications',
};

const formatDate = (notification: AppNotification) => notification.notifTimestamp
  ? notification.notifTimestamp.toDate().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  : '';

interface NotificationCardProps {
  item: AppNotification;
  onOpen: () => void;
}

function NotificationCard({ item, onOpen }: NotificationCardProps) {
  return (
    <li>
      <button
        type="button"
        className={`notif-card${item.isRead ? '' : ' notif-card--unread'}`}
        onClick={onOpen}
      >
        <p className="notif-card-message">
          {item.actorName && <><strong>{item.actorName}</strong> </>}
          {item.message}
        </p>
        {item.category && <CategoryTag>{item.category}</CategoryTag>}
        <span className="notif-card-row">
          <span className="notif-card-title">{item.title ?? item.message}</span>
          <span className="notif-card-date">{formatDate(item)}</span>
        </span>
      </button>
    </li>
  );
}

export default function NotificationsPage({ mode }: { mode: UserMode }) {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const UID = userDoc?.UID ?? null;
  const dashboardPath = mode === 'volunteer' ? '/volunteer/dashboard' : '/student/dashboard';
  const backgroundClass = mode === 'volunteer'
    ? 'ui-page-volunteer-background'
    : 'ui-page-student-background';
  const [filter, setFilter] = useState<Filter>('all');
  const [notificationLoad, setNotificationLoad] = useState<{
    UID: string;
    notifications: AppNotification[];
    error?: string;
  } | null>(null);
  const [actionError, setActionError] = useState('');
  const isLoading = authLoading || (!!UID && notificationLoad?.UID !== UID);
  const loadError = !authLoading && !UID
    ? 'Sign in to view your notifications.'
    : notificationLoad?.UID === UID
      ? notificationLoad.error ?? ''
      : '';
  const notifications = UID && notificationLoad?.UID === UID
    ? notificationLoad.notifications
    : [];

  useEffect(() => {
    if (authLoading || !UID) return;
    return subscribeToNotificationsByUser(
      UID,
      loadedNotifications => {
        setNotificationLoad({ UID, notifications: loadedNotifications });
      },
      error => {
        console.error('Could not load notifications:', error);
        setNotificationLoad({
          UID,
          notifications: [],
          error: 'Could not load your notifications. Please try again.',
        });
      },
    );
  }, [UID, authLoading]);

  const visible = filter === 'all'
    ? notifications
    : notifications.filter(notification => notification.kind === filter);

  const openNotification = async (notification: AppNotification) => {
    if (UID && !notification.isRead) {
      setActionError('');
      try {
        await markNotificationAsRead(notification.notifID, UID);
      } catch (error) {
        console.error('Could not mark notification as read:', error);
        setActionError('Could not update this notification. Please try again.');
        return;
      }
    }
    navigate(notification.redirectionLink || dashboardPath);
  };

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

          {loadError && <p className="notif-error" role="alert">{loadError}</p>}
          {actionError && <p className="notif-error" role="alert">{actionError}</p>}
          <ul className="notif-list" aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <li className="notif-empty" role="status">Loading notifications...</li>
            ) : (
              <>
                {visible.map(item => (
                  <NotificationCard
                    key={item.notifID}
                    item={item}
                    onOpen={() => void openNotification(item)}
                  />
                ))}
                {visible.length === 0 && (
                  <li className="notif-empty">
                    {loadError ? '' : UID ? EMPTY_MESSAGES[filter] : ''}
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
