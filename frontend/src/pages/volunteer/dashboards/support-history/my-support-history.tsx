import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext';

import SupportDetailsModal from './support-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft, RatedIcon } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import { buildVolunteerSessionItems } from '../../volunteer-utils.ts';
import type { VolunteerSessionItem, VolunteerStudentSummary } from '../../volunteer-utils.ts';
import { getRequestsByVolunteer } from '../../../../services/RequestService';
import { getSessionsByRequestIDs } from '../../../../services/SessionService';
import { getUser } from '../../../../services/UserService';
import { getFeedbackBySession } from '../../../../services/FeedbackService';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';


function VolunteerHistory() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const volunteerUID = userDoc?.UID ?? null;

  const [historyLoad, setHistoryLoad] = useState<{
    volunteerUID: string;
    items: VolunteerSessionItem[];
    error?: string;
  } | null>(null);
  const isLoading = authLoading || (!!volunteerUID && historyLoad?.volunteerUID !== volunteerUID);
  const loadError = !authLoading && !volunteerUID
    ? 'Sign in to view your support history.'
    : historyLoad?.volunteerUID === volunteerUID
      ? historyLoad.error ?? ''
      : '';
  const history = volunteerUID && historyLoad?.volunteerUID === volunteerUID ? historyLoad.items : [];

  useEffect(() => {
    if (authLoading || !volunteerUID) return;

    let isCurrent = true;

    const loadHistory = async () => {
      try {
        const requests = await getRequestsByVolunteer(volunteerUID);
        const sessions = await getSessionsByRequestIDs(requests.map(request => request.reqID));

        // History = sessions that are over: rated or cancelled
        const finished = sessions.filter(session => session.sessStatus === 'Rated' || session.sessStatus === 'Cancelled');
        const finishedRequestIDs = new Set(finished.map(session => session.reqID));
        const studentIDs = [...new Set(
          requests
            .filter(request => finishedRequestIDs.has(request.reqID))
            .map(request => request.studUID)
        )];

        const studentEntries = await Promise.all(studentIDs.map(async studUID => {
          const user = await getUser(studUID);
          const summary: VolunteerStudentSummary = {
            name: user?.name ?? 'Student',
          };
          return [studUID, summary] as const;
        }));

        // Only rated sessions have feedback; cancelled ones never will
        const feedbackBySession = Object.fromEntries(
          (await Promise.all(
            finished
              .filter(session => session.sessStatus === 'Rated')
              .map(async session => [session.sessID, await getFeedbackBySession(session.sessID)] as const)
          )).flatMap(([sessID, feedback]) => feedback ? [[sessID, feedback] as const] : [])
        );

        if (isCurrent) {
          setHistoryLoad({
            volunteerUID,
            items: buildVolunteerSessionItems(finished, requests, Object.fromEntries(studentEntries))
              .map(item => {
                const feedback = feedbackBySession[item.sessID];
                return feedback
                  ? { ...item, volunteerRating: feedback.rating, studentFeedback: { rating: feedback.rating, comments: feedback.comments } }
                  : item;
              })
              .sort((a, b) => b.sessDate.getTime() - a.sessDate.getTime()), // newest first
          });
        }
      } catch (error) {
        console.error('Error loading volunteer support history:', error);
        if (isCurrent) {
          setHistoryLoad({
            volunteerUID,
            items: [],
            error: 'Could not load your support history. Please try again.',
          });
        }
      }
    };

    void loadHistory();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, volunteerUID]);

  const [selected, setSelected] = useState<VolunteerSessionItem | null>(null);
  const handleViewDetails = (item: VolunteerSessionItem) => setSelected(item);

  return (
    <div className="ui-page">
      <Navbar dashboardPath="/volunteer/dashboard" />
      <main className="volunteer-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/volunteer/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--yellow">
              <div>
                <h1 className="dashboard-banner-title">Support History</h1>
                <p className="dashboard-banner-subtitle">Completed and cancelled sessions</p>
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
                    rating={item.volunteerRating}
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
        <SupportDetailsModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default VolunteerHistory;