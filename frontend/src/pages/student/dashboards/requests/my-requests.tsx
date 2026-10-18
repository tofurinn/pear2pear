import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RequestDetailsModal from './request-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import ConfirmPopup from '../../../../components/popup/confirm-popup.tsx';
import { buildStudentRequestItems } from '../../student-utils.tsx';
import type { StudentRequestItem } from '../../student-utils.tsx';
import type { StudentVolunteerSummary } from '../../student-utils.tsx';

import { useAuth } from '../../../../context/authContext';
import { cancelPendingSupportRequest, getRequestsByStudent } from '../../../../services/RequestService';
import { getUser } from '../../../../services/UserService';
import { getVolunteer } from '../../../../services/VolunteerService';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

const EMPTY_REQUESTS: Awaited<ReturnType<typeof getRequestsByStudent>> = [];
const EMPTY_VOLUNTEERS: Record<string, StudentVolunteerSummary> = {};

// ─── Page ──────────────────────────────────────────────────────────────────────

function StudentRequests() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const studentUID = userDoc?.UID ?? null;

  const [requestLoad, setRequestLoad] = useState<{
    studentUID: string | null;
    requests: Awaited<ReturnType<typeof getRequestsByStudent>>;
    volunteers: Record<string, StudentVolunteerSummary>;
    error?: string;
  } | null>(null);
  const loading = authLoading || (!!studentUID && requestLoad?.studentUID !== studentUID);
  const error = !authLoading && !studentUID
    ? 'Sign in to view your requests.'
    : requestLoad?.studentUID === studentUID
      ? requestLoad.error ?? ''
      : '';
  const requests = studentUID && requestLoad?.studentUID === studentUID
    ? requestLoad.requests
    : EMPTY_REQUESTS;
  const volunteers = studentUID && requestLoad?.studentUID === studentUID
    ? requestLoad.volunteers
    : EMPTY_VOLUNTEERS;

  useEffect(() => {
    if (authLoading || !studentUID) return;

    let isCurrent = true;
    const loadRequests = async () => {
      try {
        const loadedRequests = await getRequestsByStudent(studentUID);
        const volunteerIDs = [...new Set(loadedRequests.map(request => request.volUID))];
        const volunteerEntries = await Promise.all(volunteerIDs.map(async volunteerID => {
          const [user, volunteer] = await Promise.all([
            getUser(volunteerID),
            getVolunteer(volunteerID),
          ]);
          const summary: StudentVolunteerSummary = {
            name: user?.name ?? 'Volunteer',
            rating: volunteer?.avgRating ?? 0,
            ratingCount: 0,
            skills: volunteer?.skills,
          };
          return [volunteerID, summary] as const;
        }));

        if (isCurrent) {
          setRequestLoad({
            studentUID,
            requests: loadedRequests,
            volunteers: Object.fromEntries(volunteerEntries),
          });
        }
      } catch (loadError) {
        console.error('Error loading student requests:', loadError);
        if (isCurrent) {
          setRequestLoad({
            studentUID,
            requests: [],
            volunteers: {},
            error: 'Could not load your requests.',
          });
        }
      }
    };

    void loadRequests();
    return () => { isCurrent = false; };
  }, [authLoading, studentUID]);

  const items = useMemo(
    () => buildStudentRequestItems(requests, volunteers),
    [requests, volunteers]
  );

  const pending = items.filter(item => item.reqStatus === 'Pending');
  const accepted = items.filter(item => item.reqStatus === 'Accepted');
  // Inactive = no longer waiting on anything: already turned into a session, rejected, or cancelled
  const inactive = items.filter(item => ['Scheduled', 'Rejected', 'Cancelled'].includes(item.reqStatus));

  const [selected, setSelected] = useState<StudentRequestItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<StudentRequestItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState('');
  const handleViewDetails = (item: StudentRequestItem) => setSelected(item);

  const handleCancelRequest = async () => {
    if (!cancelTarget || !studentUID) return;

    setIsCancelling(true);
    setActionError('');
    try {
      await cancelPendingSupportRequest(cancelTarget.reqID, studentUID);
      setRequestLoad(previous => previous?.studentUID === studentUID
        ? {
            ...previous,
            requests: previous.requests.map(request => request.reqID === cancelTarget.reqID
              ? { ...request, reqStatus: 'Cancelled' }
              : request
            ),
          }
        : previous
      );
      setSelected(null);
      setCancelTarget(null);
    } catch (error) {
      console.error('Error cancelling student support request:', error);
      setActionError(error instanceof Error ? error.message : 'Could not cancel this request. Please try again.');
      setCancelTarget(null);
      setSelected(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="ui-page">
      <Navbar />
      <main className="student-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/student/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--blue">
              <div>
                <h1 className="dashboard-banner-title">My Requests</h1>
                <p className="dashboard-banner-subtitle">Don’t be afraid to receive aid!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white ui-btn-white--blue" onClick={() => navigate('/student/request-form')}>
                Request Support
              </button>
            </header>

            {loading ? (
              <p className="dashboard-empty">Loading your requests...</p>
            ) : error ? (
              <p className="dashboard-empty">{error}</p>
            ) : (
              <>
              {actionError && <p className="ui-error" role="alert">{actionError}</p>}
              <div className="dashboard-board dashboard-board--three dashboard-board--scroll-columns">
                <section>
                  <h2 className="dashboard-section-title">Pending</h2>
                  <div className="dashboard-cards dashboard-cards--scroll">
                    {pending.map(item => (
                      <ItemCard
                        key={item.reqID}
                        category={item.category}
                        title={item.title}
                        personName={item.personName}
                        dateLabel={item.dateLabel}
                        pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                        onViewDetails={() => handleViewDetails(item)}
                      />
                    ))}
                    {pending.length === 0 && <p className="dashboard-empty">No pending requests</p>}
                  </div>
                </section>

                <section>
                  <h2 className="dashboard-section-title">Accepted</h2>
                  <div className="dashboard-cards dashboard-cards--scroll">
                    {accepted.map(item => (
                      <ItemCard
                        key={item.reqID}
                        category={item.category}
                        title={item.title}
                        personName={item.personName}
                        dateLabel={item.dateLabel}
                        pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                        onViewDetails={() => handleViewDetails(item)}
                      />
                    ))}
                    {accepted.length === 0 && <p className="dashboard-empty">No accepted requests</p>}
                  </div>
                </section>

                <section>
                  <h2 className="dashboard-section-title">Inactive</h2>
                  <div className="dashboard-cards dashboard-cards--scroll">
                    {inactive.map(item => (
                      <ItemCard
                        key={item.reqID}
                        category={item.category}
                        title={item.title}
                        personName={item.personName}
                        dateLabel={item.dateLabel}
                        pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                        onViewDetails={() => handleViewDetails(item)}
                      />
                    ))}
                    {inactive.length === 0 && <p className="dashboard-empty">No inactive requests</p>}
                  </div>
                </section>
              </div>
              </>
            )}
          </section>
        </div>
      </main>

      {selected && (
        <RequestDetailsModal
          item={selected}
          onClose={() => setSelected(null)}
          onSchedule={() => navigate('/student/session-form', { state: { reqID: selected.reqID } })}
          onCancelRequest={() => setCancelTarget(selected)}
          onResubmitRequest={() => navigate('/student/request-form', { state: { resubmitReqID: selected.reqID } })}
        />
      )}

      <ConfirmPopup
        open={cancelTarget !== null}
        title="Cancel this support request?"
        message="This request will move to Inactive and the volunteer will no longer be able to respond."
        confirmLabel="Cancel Request"
        busy={isCancelling}
        busyLabel="Cancelling..."
        onConfirm={() => void handleCancelRequest()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

export default StudentRequests;