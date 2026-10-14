import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext';

import RequestDetailsModal from './request-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { BoardSection, ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import { createVolunteerRequestPatch, toVolunteerRequestItem } from '../../volunteer-utils.ts';
import type { VolunteerRequestItem } from '../../volunteer-utils.ts';
import { getRequestsByVolunteer, updateRequestStatus } from '../../../../services/RequestService';
import { getUser } from '../../../../services/UserService';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

function VolunteerRequests() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const volunteerUID = userDoc?.UID ?? null;

  const [requestLoad, setRequestLoad] = useState<{
    volunteerUID: string | null;
    items: VolunteerRequestItem[];
    error?: string;
  } | null>(null);
  const isLoading = authLoading || (!!volunteerUID && requestLoad?.volunteerUID !== volunteerUID);
  const loadError = !authLoading && !volunteerUID
    ? 'Sign in to view your incoming requests.'
    : requestLoad?.volunteerUID === volunteerUID
      ? requestLoad.error ?? ''
      : '';
  const items = volunteerUID && requestLoad?.volunteerUID === volunteerUID
    ? requestLoad.items
    : [];

  useEffect(() => {
    if (authLoading || !volunteerUID) return;

    let isCurrent = true;
    const loadRequests = async () => {
      try {
        const requests = await getRequestsByVolunteer(volunteerUID);
        const studentIDs = [...new Set(requests.map(request => request.studUID))];
        const studentEntries = await Promise.all(studentIDs.map(async studUID => {
          const user = await getUser(studUID);
          return [studUID, user?.name ?? 'Student'] as const;
        }));
        const studentNames = Object.fromEntries(studentEntries);

        if (isCurrent) {
          setRequestLoad({
            volunteerUID,
            items: requests.map(request =>
              toVolunteerRequestItem(request, studentNames[request.studUID] ?? 'Student')
            ),
          });
        }
      } catch (error) {
        console.error('Error loading volunteer requests:', error);
        if (isCurrent) {
          setRequestLoad({
            volunteerUID,
            items: [],
            error: 'Could not load your requests. Please try again.',
          });
        }
      }
    };

    void loadRequests();
    return () => { isCurrent = false; };
  }, [authLoading, volunteerUID]);

  const [selectedID, setSelectedID] = useState<VolunteerRequestItem['reqID'] | null>(null);
  const selected = items.find(item => item.reqID === selectedID) ?? null;
  const [actionError, setActionError] = useState('');
  const [updatingRequestID, setUpdatingRequestID] = useState<string | null>(null);

  const pending = items.filter(item => item.reqStatus === 'Pending');
  const accepted = items.filter(item => item.reqStatus === 'Accepted');
  // Inactive = already turned into a session, rejected, or cancelled
  const inactive = items.filter(item => ['Scheduled', 'Rejected', 'Cancelled'].includes(item.reqStatus));

  const updateRequest = async (
    item: VolunteerRequestItem,
    reqStatus: Extract<VolunteerRequestItem['reqStatus'], 'Accepted' | 'Rejected'>,
  ) => {
    if (!volunteerUID) return;
    setUpdatingRequestID(item.reqID);
    setActionError('');

    try {
      await updateRequestStatus(item.reqID, reqStatus);
      setRequestLoad(previous => previous?.volunteerUID === volunteerUID
        ? {
            ...previous,
            items: previous.items.map(request => request.reqID === item.reqID
              ? { ...request, ...createVolunteerRequestPatch(reqStatus) }
              : request
            ),
            error: undefined,
          }
        : previous
      );
      setSelectedID(null);
    } catch (error) {
      console.error(`Error updating volunteer request "${item.reqID}":`, error);
      setActionError('Could not update this request. Please try again.');
    } finally {
      setUpdatingRequestID(null);
    }
  };

  const handleAccept = (item: VolunteerRequestItem) => updateRequest(item, 'Accepted');
  const handleReject = (item: VolunteerRequestItem) => updateRequest(item, 'Rejected');

  const renderCard = (item: VolunteerRequestItem) => {
    const { tone, label } = item.status;

    return (
      <ItemCard
        key={item.reqID}
        category={item.category}
        title={item.title}
        personName={item.personName}
        dateLabel={item.dateLabel}
        pill={<StatusPill tone={tone} label={label} />}
        onViewDetails={() => setSelectedID(item.reqID)}
      />
    );
  };

  return (
    <div className="ui-page">
      <Navbar dashboardPath="/volunteer/dashboard" />
      <main className="volunteer-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/volunteer/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--blue">
              <div>
                <h1 className="dashboard-banner-title">Incoming Requests</h1>
                <p className="dashboard-banner-subtitle">Check in to see which pear needs you!</p>
              </div>
            </header>

            {loadError && <p className="ui-error" role="alert">{loadError}</p>}
            {actionError && <p className="ui-error" role="alert">{actionError}</p>}
            {isLoading && <p className="dashboard-empty" role="status">Loading incoming requests...</p>}

            <div className="dashboard-board dashboard-board--three dashboard-board--scroll-columns" aria-busy={isLoading}>
              <BoardSection title="Pending" count={pending.length} emptyText={isLoading ? '' : 'No pending requests'} cardsClassName="dashboard-cards--scroll">
                {!isLoading && pending.map(renderCard)}
              </BoardSection>

              <BoardSection title="Accepted" count={accepted.length} emptyText={isLoading ? '' : 'No accepted requests'} cardsClassName="dashboard-cards--scroll">
                {!isLoading && accepted.map(renderCard)}
              </BoardSection>

              <BoardSection title="Inactive" count={inactive.length} emptyText={isLoading ? '' : 'No inactive requests'} cardsClassName="dashboard-cards--scroll">
                {!isLoading && inactive.map(renderCard)}
              </BoardSection>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <RequestDetailsModal
          item={selected}
          onClose={() => setSelectedID(null)}
          onAccept={() => void handleAccept(selected)}
          onReject={() => void handleReject(selected)}
          onSchedule={() => navigate('/volunteer/session-form', { state: { reqID: selected.reqID } })}
          onViewSession={() => navigate('/volunteer/my-sessions')}
          isUpdating={updatingRequestID === selected.reqID}
        />
      )}
    </div>
  );
}

export default VolunteerRequests;