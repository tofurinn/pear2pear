import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RequestDetailsModal from './request-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import {
  BoardSection,
  ItemCard,
  StatusPill,
} from '../volunteer-shared.tsx';
import { MOCK_INCOMING_REQUESTS, requestPatch } from '../volunteer-utils.ts';
import type { VolunteerRequestItem } from '../volunteer-utils.ts';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

function VolunteerRequests() {
  const navigate = useNavigate();

  // TODO: load the requests sent to this volunteer (and the students' names) from Firestore
  const [items, setItems] = useState<VolunteerRequestItem[]>(MOCK_INCOMING_REQUESTS);
  const [selectedID, setSelectedID] = useState<VolunteerRequestItem['reqID'] | null>(null);
  const selected = items.find(item => item.reqID === selectedID) ?? null;

  const pending = items.filter(item => item.reqStatus === 'Pending');
  const accepted = items.filter(item => item.reqStatus === 'Accepted');
  // Inactive = already turned into a session, rejected, or cancelled
  const inactive = items.filter(item => ['Scheduled', 'Rejected', 'Cancelled'].includes(item.reqStatus));

  // TODO: also write the new status to Firestore
  const updateRequest = (id: VolunteerRequestItem['reqID'], patch: Partial<VolunteerRequestItem>) =>
    setItems(prev => prev.map(item => (item.reqID === id ? { ...item, ...patch } : item)));

  const handleAccept = (item: VolunteerRequestItem) => updateRequest(item.reqID, requestPatch('Accepted', 'accepted', 'Accepted'));
  const handleReject = (item: VolunteerRequestItem) => updateRequest(item.reqID, requestPatch('Rejected', 'rejected', 'Rejected'));

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

          <section className="dashboard-card">
            <header className="dashboard-banner dashboard-banner--blue">
              <div>
                <h1 className="dashboard-banner-title">Incoming Requests</h1>
                <p className="dashboard-banner-subtitle">Check in to see which pear needs you!</p>
              </div>
            </header>

            <div className="dashboard-board dashboard-board--three">
              <BoardSection title="Pending" count={pending.length} emptyText="No pending requests">
                {pending.map(renderCard)}
              </BoardSection>

              <BoardSection title="Accepted" count={accepted.length} emptyText="No accepted requests">
                {accepted.map(renderCard)}
              </BoardSection>

              <BoardSection title="Inactive" count={inactive.length} emptyText="No inactive requests">
                {inactive.map(renderCard)}
              </BoardSection>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <RequestDetailsModal
          item={selected}
          onClose={() => setSelectedID(null)}
          onAccept={() => handleAccept(selected)}
          onReject={() => handleReject(selected)}
          onSchedule={() => navigate('/volunteer/session-form', { state: { reqID: selected.reqID } })}
          onViewSession={() => navigate('/volunteer/sessions')}
        />
      )}
    </div>
  );
}

export default VolunteerRequests;