import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import SessionDetailsModal from './session-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import {
  BoardSection,
  ItemCard,
  StatusPill,
} from '../volunteer-shared.tsx';
import { MOCK_VOLUNTEER_SESSIONS, sessionPatch } from '../volunteer-utils.ts';
import type { VolunteerSessionItem } from '../volunteer-utils.ts';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

function VolunteerSessions() {
  const navigate = useNavigate();

  // TODO: load this volunteer's sessions (and the students' names) from Firestore
  const [items, setItems] = useState<VolunteerSessionItem[]>(MOCK_VOLUNTEER_SESSIONS);
  const [selectedID, setSelectedID] = useState<VolunteerSessionItem['sessID'] | null>(null);
  const selected = items.find(item => item.sessID === selectedID) ?? null;

  const planned = items.filter(item => item.sessStatus === 'Planned');
  const confirmed = items.filter(item => item.sessStatus === 'Confirmed');
  const pendingFeedback = items.filter(item => item.sessStatus === 'Completed'); // 'Rated' ones live in Support History

  // TODO: also write the new status to Firestore
  const updateSession = (id: VolunteerSessionItem['sessID'], patch: Partial<VolunteerSessionItem>) =>
    setItems(prev => prev.map(item => (item.sessID === id ? { ...item, ...patch } : item)));

  const handleConfirm = (item: VolunteerSessionItem) =>
    updateSession(item.sessID, { ...sessionPatch('Confirmed', 'confirmed', 'Confirmed'), awaitingMyConfirmation: false });
  const handleCancel = (item: VolunteerSessionItem) =>
    updateSession(item.sessID, sessionPatch('Cancelled', 'cancelled', 'Cancelled'));
  const handleMarkComplete = (item: VolunteerSessionItem) =>
    updateSession(item.sessID, sessionPatch('Completed', 'awaiting', 'Awaiting Feedback'));

  return (
    <div className="ui-page">
      <Navbar dashboardPath="/volunteer/dashboard" />
      <main className="volunteer-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/volunteer/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--volunteer-sessions">
            <header className="dashboard-banner dashboard-banner--green">
              <div>
                <h1 className="dashboard-banner-title">My Sessions</h1>
                <p className="dashboard-banner-subtitle">Track your sessions!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white" onClick={() => navigate('/volunteer/session-form')}>
                Schedule Session
              </button>
            </header>

            <div className="dashboard-board dashboard-board--three dashboard-board--scroll-columns">
              <BoardSection
                title="Planned"
                count={planned.length}
                emptyText="No planned sessions"
                cardsClassName="dashboard-cards--scroll"
              >
                {planned.map(item => (
                  <ItemCard
                    key={item.sessID}
                    category={item.category}
                    title={item.title}
                    personName={item.personName}
                    dateLabel={item.dateLabel}
                    pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                    onViewDetails={() => setSelectedID(item.sessID)}
                  />
                ))}
              </BoardSection>

              <BoardSection
                title="Confirmed"
                count={confirmed.length}
                emptyText="No confirmed sessions"
                cardsClassName="dashboard-cards--scroll"
              >
                {confirmed.map(item => (
                  <ItemCard
                    key={item.sessID}
                    category={item.category}
                    title={item.title}
                    personName={item.personName}
                    dateLabel={item.dateLabel}
                    pill={item.canMarkComplete ? undefined : <StatusPill tone={item.status.tone} label={item.status.label} />}
                    onViewDetails={() => setSelectedID(item.sessID)}
                  />
                ))}
              </BoardSection>

              <BoardSection
                title="To Rate"
                count={pendingFeedback.length}
                emptyText="No sessions to rate"
                cardsClassName="dashboard-cards--scroll"
              >
                {pendingFeedback.map(item => (
                  <ItemCard
                    key={item.sessID}
                    category={item.category}
                    title={item.title}
                    personName={item.personName}
                    dateLabel={item.dateLabel}
                    pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                    onViewDetails={() => setSelectedID(item.sessID)}
                  />
                ))}
              </BoardSection>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <SessionDetailsModal
          item={selected}
          onClose={() => setSelectedID(null)}
          onConfirm={() => handleConfirm(selected)}
          onCancelSession={() => handleCancel(selected)}
          onMarkComplete={() => handleMarkComplete(selected)}
        />
      )}
    </div>
  );
}

export default VolunteerSessions;