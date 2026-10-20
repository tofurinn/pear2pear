import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../context/authContext";
import SessionDetailsModal from './session-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import ConfirmPopup from '../../../../components/popup/confirm-popup.tsx';
import { createNotification } from '../../../../services/NotificationService';

import { buildStudentSessionItems, getStudentSessionStatus, hourToSlot, toDateKey } from '../../student-utils.tsx';
import type { StudentSessionItem, StudentVolunteerSummary } from '../../student-utils.tsx';
import { getRequestsByStudent, getSupportRequest } from '../../../../services/RequestService';
import { getSessionsByRequestIDs, updateSessionStatus, updateSupportSession } from '../../../../services/SessionService';
import { getVolunteer } from '../../../../services/VolunteerService';
import { getUser } from '../../../../services/UserService';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

// ─── Page ──────────────────────────────────────────────────────────────────────

function StudentSessions() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const studentUID = userDoc?.UID ?? null;

  const [sessionLoad, setSessionLoad] = useState<{
    studentUID: string;
    items: StudentSessionItem[];
    error?: string;
  } | null>(null);
  const isLoading = authLoading || (!!studentUID && sessionLoad?.studentUID !== studentUID);
  const loadError = !authLoading && !studentUID
    ? 'Sign in to view your sessions.'
    : sessionLoad?.studentUID === studentUID
      ? sessionLoad.error ?? ''
      : '';
  const items = studentUID && sessionLoad?.studentUID === studentUID ? sessionLoad.items : [];
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading || !studentUID) return;

    let isCurrent = true;

    const loadSessions = async () => {
      try {
        const requests = await getRequestsByStudent(studentUID);
        const sessions = await getSessionsByRequestIDs(requests.map(request => request.reqID));
        const sessionsRequestIDs = new Set(sessions.map(session => session.reqID));
        const volunteerIDs = [...new Set(
          requests
            .filter(request => sessionsRequestIDs.has(request.reqID))
            .map(request => request.volUID)
        )];

        const volunteerEntries = await Promise.all(volunteerIDs.map(async volUID => {
          const [user, volunteer] = await Promise.all([getUser(volUID), getVolunteer(volUID)]);
          const summary: StudentVolunteerSummary = {
            name: user?.name ?? 'Volunteer',
            rating: volunteer?.avgRating ?? 0,
            ratingCount: 0,
            skills: volunteer?.skills,
          };
          return [volUID, summary] as const;
        }));

        if (isCurrent) {
          setSessionLoad({
            studentUID,
            items: buildStudentSessionItems(sessions, requests, Object.fromEntries(volunteerEntries)),
          });
        }
      } catch (error) {
        console.error('Error loading student sessions:', error);
        if (isCurrent) {
          setSessionLoad({
            studentUID,
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
  }, [authLoading, studentUID]);

  const currentItems = items.map(item => ({ ...item, status: getStudentSessionStatus(item, currentTime) }));
  const planned = currentItems.filter(item => item.sessStatus === 'Planned');
  const confirmed = currentItems.filter(item => item.sessStatus === 'Confirmed');
  const toRate = currentItems.filter(item => item.sessStatus === 'Completed'); // 'Rated' ones live in Support History

  const [selected, setSelected] = useState<StudentSessionItem | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'cancel' | 'confirm';
    item: StudentSessionItem;
  } | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const handleViewDetails = (item: StudentSessionItem) => setSelected(item);
  const handleFeedback = (item: StudentSessionItem) => navigate(`/student/feedback-form/${item.sessID}`);

  const cancelSession = async (item: StudentSessionItem) => {
    try {
      await updateSessionStatus(item.sessID, 'Cancelled');
      try {
        const request = await getSupportRequest(item.reqID);
        if (!request) throw new Error('Could not find the support request for this session.');
        await createNotification({
          UID: request.volUID,
          kind: 'session',
          actorName: userDoc?.name ?? 'Your student',
          message: 'cancelled the support session.',
          category: item.category,
          title: item.title,
          redirectionLink: '/volunteer/my-sessions',
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Session cancelled, but its notification could not be created:', notificationError);
      }
      setSessionLoad(previous => previous?.studentUID === studentUID
        ? {
            ...previous,
            items: previous.items.map(session => session.sessID === item.sessID
              ? { ...session, sessStatus: 'Cancelled' }
              : session
            ),
            error: undefined,
          }
        : previous
      );
      setSelected(null);
    } catch (error) {
      console.error('Error cancelling student session:', error);
      setSessionLoad(previous => previous?.studentUID === studentUID
        ? { ...previous, error: 'Could not cancel this session. Please try again.' }
        : previous
      );
    }
  };

  const confirmArrangement = async (item: StudentSessionItem) => {
    try {
      await updateSupportSession(item.sessID, {
        sessStatus: 'Confirmed',
        studConfirmed: true,
        volConfirmed: true,
      });
      try {
        const request = await getSupportRequest(item.reqID);
        if (!request) throw new Error('Could not find the support request for this session.');
        await createNotification({
          UID: request.volUID,
          kind: 'confirmed',
          actorName: userDoc?.name ?? 'Your student',
          message: 'confirmed the session arrangement.',
          category: item.category,
          title: item.title,
          redirectionLink: '/volunteer/my-sessions',
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Session confirmed, but its notification could not be created:', notificationError);
      }
      setSessionLoad(previous => previous?.studentUID === studentUID
        ? {
            ...previous,
            items: previous.items.map(session => session.sessID === item.sessID
              ? { ...session, sessStatus: 'Confirmed', studConfirmed: true, volConfirmed: true }
              : session
            ),
            error: undefined,
          }
        : previous
      );
      setSelected(null);
    } catch (error) {
      console.error('Error confirming student session arrangement:', error);
      setSessionLoad(previous => previous?.studentUID === studentUID
        ? { ...previous, error: 'Could not confirm this arrangement. Please try again.' }
        : previous
      );
    }
  };

  const handleCancelSession = (item: StudentSessionItem) => setPendingAction({ type: 'cancel', item });
  const handleConfirmArrangement = (item: StudentSessionItem) => setPendingAction({ type: 'confirm', item });
  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    setIsActionPending(true);
    try {
      if (pendingAction.type === 'cancel') {
        await cancelSession(pendingAction.item);
      } else {
        await confirmArrangement(pendingAction.item);
      }
    } finally {
      setIsActionPending(false);
      setPendingAction(null);
    }
  };

  const handleRearrangeSession = (item: StudentSessionItem) => {
    navigate(`/student/session-edit/${item.sessID}`, {
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

  return (
    <div className="ui-page">
      <Navbar dashboardPath="/student/dashboard" />
      <main className="student-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/student/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--green">
              <div>
                <h1 className="dashboard-banner-title">My Sessions</h1>
                <p className="dashboard-banner-subtitle">Track your sessions!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white" onClick={() => navigate('/student/session-form')}>
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
                <h2 className="dashboard-section-title">To Rate</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {toRate.map(item => (
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
                  {!isLoading && toRate.length === 0 && <p className="dashboard-empty">Nothing to rate</p>}
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
          onSubmitFeedback={handleFeedback}
          onCancelSession={handleCancelSession}
          onRearrange={handleRearrangeSession}
          onConfirmArrangement={handleConfirmArrangement}
        />
      )}
      <ConfirmPopup
        open={pendingAction !== null}
        title={pendingAction?.type === 'cancel' ? 'Cancel session?' : 'Confirm arrangement?'}
        message={pendingAction?.type === 'cancel'
          ? 'Are you sure you want to cancel this session?'
          : 'Are you sure you want to confirm this session arrangement?'}
        confirmLabel={pendingAction?.type === 'cancel' ? 'Cancel Session' : 'Confirm Session'}
        busy={isActionPending}
        busyLabel="Updating session..."
        onConfirm={() => void handleConfirmPendingAction()}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export default StudentSessions;