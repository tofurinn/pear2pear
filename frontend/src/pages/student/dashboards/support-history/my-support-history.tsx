import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext';

import SupportDetailsModal from './support-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft, RatedIcon } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import { buildStudentSessionItems } from '../../student-utils.tsx';
import type { StudentSessionItem } from '../../student-utils.tsx';
import type { Feedback } from '../../../../types/Feedback';
import { getRequestsByStudent } from '../../../../services/RequestService';
import { getFeedbackBySession } from '../../../../services/FeedbackService';
import { getSessionsByRequestIDs } from '../../../../services/SessionService';
import { getUser } from '../../../../services/UserService';
import { getVolunteer } from '../../../../services/VolunteerService';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';


function StudentHistory({ dashboardPath = '/student/dashboard' }: { dashboardPath?: string }) {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const studentUID = userDoc?.UID ?? null;

  const [historyLoad, setHistoryLoad] = useState<{
    studentUID: string;
    items: StudentSessionItem[];
    feedback: Record<string, Feedback>; // keyed by sessID
    error?: string;
  } | null>(null);
  const isLoading = authLoading || (!!studentUID && historyLoad?.studentUID !== studentUID);
  const loadError = !authLoading && !studentUID
    ? 'Sign in to view your support history.'
    : historyLoad?.studentUID === studentUID
      ? historyLoad.error ?? ''
      : '';
  const history = studentUID && historyLoad?.studentUID === studentUID ? historyLoad.items : [];
  const feedbackBySession = studentUID && historyLoad?.studentUID === studentUID ? historyLoad.feedback : {};

  useEffect(() => {
    if (authLoading || !studentUID) return;

    let isCurrent = true;

    const loadHistory = async () => {
      try {
        const requests = await getRequestsByStudent(studentUID);
        const sessions = await getSessionsByRequestIDs(requests.map(request => request.reqID));

        // History = sessions that are over: rated (completed unrated ones stay in My Sessions) or cancelled
        const finished = sessions.filter(session => session.sessStatus === 'Rated' || session.sessStatus === 'Cancelled');
        const finishedRequestIDs = new Set(finished.map(session => session.reqID));
        const volunteerIDs = [...new Set(
          requests
            .filter(request => finishedRequestIDs.has(request.reqID))
            .map(request => request.volUID)
        )];

        const volunteerEntries = await Promise.all(volunteerIDs.map(async volUID => {
          const [user, volunteer] = await Promise.all([getUser(volUID), getVolunteer(volUID)]);
          const summary = {
            volUID,
            name: user?.name ?? 'Volunteer',
            rating: volunteer?.avgRating ?? 0,
            ratingCount: 0,
            tags: volunteer?.skills ?? [],
          };
          return [volUID, summary] as const;
        }));

        // Only rated sessions have feedback; cancelled ones never will
        const feedbackEntries = (await Promise.all(
          finished
            .filter(session => session.sessStatus === 'Rated')
            .map(async session => [session.sessID, await getFeedbackBySession(session.sessID)] as const)
        )).flatMap(([sessID, feedback]) => feedback ? [[sessID, feedback] as const] : []);

        if (isCurrent) {
          setHistoryLoad({
            studentUID,
            items: buildStudentSessionItems(finished, requests, Object.fromEntries(volunteerEntries))
              .sort((a, b) => b.sessDate.getTime() - a.sessDate.getTime()), // newest first
            feedback: Object.fromEntries(feedbackEntries),
          });
        }
      } catch (error) {
        console.error('Error loading support history:', error);
        if (isCurrent) {
          setHistoryLoad({
            studentUID,
            items: [],
            feedback: {},
            error: 'Could not load your support history. Please try again.',
          });
        }
      }
    };

    void loadHistory();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, studentUID]);

  const [selected, setSelected] = useState<StudentSessionItem | null>(null);
  const handleViewDetails = (item: StudentSessionItem) => setSelected(item);

  return (
    <div className="ui-page">
      <Navbar dashboardPath={dashboardPath} />
      <main className="student-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate(dashboardPath)}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--yellow">
              <div>
                <h1 className="dashboard-banner-title">Support History</h1>
                <p className="dashboard-banner-subtitle">Inactive Session History</p>
              </div>
            </header>

            {loadError && <p className="ui-error" role="alert">{loadError}</p>}
            {isLoading && <p className="dashboard-empty" role="status">Loading history...</p>}

            <div className="dashboard-board dashboard-board--single dashboard-board--scroll-columns" aria-busy={isLoading}>
              <div className="dashboard-cards dashboard-cards--scroll">
                {history.map(item => (
                  <ItemCard
                    key={item.sessID}
                    category={item.category}
                    title={item.title}
                    personName={item.personName}
                    dateLabel={item.createdLabel}
                    pill={(
                      <StatusPill
                        tone={item.status.tone}
                        label={item.status.label}
                        icon={item.status.tone === 'rated' ? <RatedIcon /> : undefined}
                      />
                    )}
                    onViewDetails={() => handleViewDetails(item)}
                  />
                ))}
                {!isLoading && history.length === 0 && <p className="dashboard-empty">No past sessions yet</p>}
              </div>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <SupportDetailsModal
          item={selected}
          feedback={feedbackBySession[selected.sessID]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default StudentHistory;