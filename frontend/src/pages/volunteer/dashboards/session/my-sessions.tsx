import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../context/authContext";
import SessionDetailsModal from './session-details.tsx';

import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import ConfirmPopup from '../../../../components/popup/confirm-popup.tsx';

import { buildVolunteerSessionItems, getVolunteerSessionStatus, hourToSlot, toDateKey } from '../../volunteer-utils.ts';
import type { VolunteerSessionItem, VolunteerStudentSummary } from '../../volunteer-utils.ts';
import { getRequestsByVolunteer } from '../../../../services/RequestService';
import { getSessionsByRequestIDs, updateSessionStatus, updateSupportSession } from '../../../../services/SessionService';
import { getUser } from '../../../../services/UserService';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

// ─── Page ──────────────────────────────────────────────────────────────────────

function VolunteerSessions() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const volunteerUID = userDoc?.UID ?? null;

  const [sessionLoad, setSessionLoad] = useState<{
    volunteerUID: string;
    items: VolunteerSessionItem[];
    error?: string;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const isLoading = authLoading || (!!volunteerUID && sessionLoad?.volunteerUID !== volunteerUID);
  const loadError = !authLoading && !volunteerUID
    ? 'Sign in to view your sessions.'
    : sessionLoad?.volunteerUID === volunteerUID
      ? sessionLoad.error ?? ''
      : '';
  const items = volunteerUID && sessionLoad?.volunteerUID === volunteerUID
    ? sessionLoad.items
    : [];
  
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading || !volunteerUID) return;

    let isCurrent = true;

    const loadSessions = async () => {
      try {
        const requests = await getRequestsByVolunteer(volunteerUID);
        const sessions = await getSessionsByRequestIDs(requests.map(request => request.reqID));
        const sessionsRequestIDs = new Set(sessions.map(session => session.reqID));
        const studentIDs = [...new Set(
          requests
            .filter(request => sessionsRequestIDs.has(request.reqID))
            .map(request => request.studUID)
        )];

        const studentEntries = await Promise.all(studentIDs.map(async studUID => {
          const user = await getUser(studUID);
          const summary: VolunteerStudentSummary = {
            name: user?.name ?? 'Student'
          };
          return [studUID, summary] as const;
        }));

        if (isCurrent) {
          setSessionLoad({
            volunteerUID,
            items: buildVolunteerSessionItems(sessions, requests, Object.fromEntries(studentEntries)),
          });
        }
      } catch (error) {
        console.error('Error loading volunteer sessions:', error);
        if (isCurrent) {
          setSessionLoad({
            volunteerUID,
            items: [],
            error: 'Could not load your sessions. Please try again.',
          });
        }
      }
    };

    void loadSessions();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, volunteerUID]);

  const updateItems = (update: (previous: VolunteerSessionItem[]) => VolunteerSessionItem[]) => {
    setSessionLoad(previous => previous?.volunteerUID === volunteerUID
      ? { ...previous, items: update(previous.items), error: undefined }
      : previous
    );
  };
  const setSessionError = (error: string) => {
    setSessionLoad(previous => previous?.volunteerUID === volunteerUID
      ? { ...previous, error }
      : previous
    );
  };

  const currentItems = items.map(item => ({ ...item, status: getVolunteerSessionStatus(item, currentTime) }));
  const planned = currentItems.filter(item => item.sessStatus === 'Planned');
  const confirmed = currentItems.filter(item => item.sessStatus === 'Confirmed');
  const pendingFeedback = currentItems.filter(item => item.sessStatus === 'Completed'); // 'Rated' ones live in Support History

  const [selected, setSelected] = useState<VolunteerSessionItem | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'cancel' | 'confirm' | 'complete';
    item: VolunteerSessionItem;
  } | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const handleViewDetails = (item: VolunteerSessionItem) => setSelected(item);
  const cancelSession = async (item: VolunteerSessionItem) => {
    try {
      await updateSessionStatus(item.sessID, 'Cancelled');
      updateItems(previous => previous.map(session => session.sessID === item.sessID
        ? { ...session, sessStatus: 'Cancelled' }
        : session
      ));
      setSelected(null);
    } catch (error) {
      console.error('Error cancelling volunteer session:', error);
      setSessionError('Could not cancel this session. Please try again.');
    }
  };
  
  const confirmArrangement = async (item: VolunteerSessionItem) => {
    try {
      await updateSupportSession(item.sessID, {
        sessStatus: 'Confirmed',
        studConfirmed: true,
        volConfirmed: true,
      });
      updateItems(previous => previous.map(session => session.sessID === item.sessID
        ? { ...session, sessStatus: 'Confirmed', studConfirmed: true, volConfirmed: true }
        : session
      ));
      setSelected(null);
    } catch (error) {
      console.error('Error confirming volunteer session arrangement:', error);
      setSessionError('Could not confirm this arrangement. Please try again.');
    }
  };

  const handleCancelSession = (item: VolunteerSessionItem) => setPendingAction({ type: 'cancel', item });
  const handleConfirmArrangement = (item: VolunteerSessionItem) => setPendingAction({ type: 'confirm', item });
  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    setIsActionPending(true);
    try {
      if (pendingAction.type === 'cancel') {
        await cancelSession(pendingAction.item);
      } else if (pendingAction.type === 'confirm') {
        await confirmArrangement(pendingAction.item);
      } else {
        await markSessionComplete(pendingAction.item);
      }
    } finally {
      setIsActionPending(false);
      setPendingAction(null);
    }
  };
  
  const handleRearrangeSession = (item: VolunteerSessionItem) => {
    navigate(`/volunteer/session-edit/${item.sessID}`, {
      state: {
        formData: {
          reqID: item.reqID,
          sessDate: toDateKey(item.sessDate),
          sessTimeSlot: hourToSlot(item.sessTimeSlot.toDate().getHours()),
          supportMode: item.supportMode ?? 'Physical',
          meetingLocation: item.location ?? '',
        },
      },
    });
  };
  
  const markSessionComplete = async (item: VolunteerSessionItem) => {
    try {
      await updateSupportSession(item.sessID, {
        sessStatus: 'Completed'
      });
      updateItems(previous => previous.map(session => session.sessID === item.sessID
        ? { ...session, sessStatus: 'Completed' }
        : session
      ));
      setSelected(null);
    } catch (error) {
      console.error('Error marking session as complete:', error);
      setSessionError('Could not mark this session as complete. Please try again.');
    }
  };
  const handleMarkComplete = (item: VolunteerSessionItem) => setPendingAction({ type: 'complete', item });

  return (
    <div className="ui-page">
      <Navbar dashboardPath="/volunteer/dashboard" />
      <main className="volunteer-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/volunteer/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--green">
              <div>
                <h1 className="dashboard-banner-title">My Sessions</h1>
                <p className="dashboard-banner-subtitle">Track your sessions!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white" onClick={() => navigate('/volunteer/session-form')}>
                Schedule Session
              </button>
            </header>

            {loadError && <p className="ui-error" role="alert">{loadError}</p>}
            {isLoading && <p className="dashboard-empty" role="status">Loading sessions...</p>}

            <div className="dashboard-board dashboard-board--three dashboard-board--scroll-columns" aria-busy={isLoading}>
              <section>
                <h2 className="dashboard-section-title">Planned</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {planned.map(item => (
                    <ItemCard
                      key={item.sessID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.createdLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {!isLoading && planned.length === 0 && <p className="dashboard-empty">No planned sessions</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Confirmed</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {confirmed.map(item => (
                    <ItemCard
                      key={item.sessID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.createdLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {!isLoading && confirmed.length === 0 && <p className="dashboard-empty">No confirmed sessions</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Pending Feedback</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {pendingFeedback.map(item => (
                    <ItemCard
                      key={item.sessID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.createdLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {!isLoading && pendingFeedback.length === 0 && <p className="dashboard-empty">No unrated sessions</p>}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <SessionDetailsModal
          item={selected}
          onClose={() => setSelected(null)}
          onCancelSession={handleCancelSession}
          onRearrange={handleRearrangeSession}
          onConfirmArrangement={handleConfirmArrangement}
          onMarkComplete={handleMarkComplete}
        />
      )}
      <ConfirmPopup
        open={pendingAction !== null}
        title={pendingAction?.type === 'cancel'
          ? 'Cancel session?'
          : pendingAction?.type === 'complete'
            ? 'Mark session complete?'
            : 'Confirm arrangement?'}
        message={pendingAction?.type === 'cancel'
          ? 'Are you sure you want to cancel this session?'
          : pendingAction?.type === 'complete'
            ? 'Are you sure you want to mark this session as complete?'
            : 'Are you sure you want to confirm this session arrangement?'}
        confirmLabel={pendingAction?.type === 'cancel'
          ? 'Cancel Session'
          : pendingAction?.type === 'complete'
            ? 'Mark Complete'
            : 'Confirm Session'}
        busy={isActionPending}
        busyLabel="Updating session..."
        onConfirm={() => void handleConfirmPendingAction()}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export default VolunteerSessions;