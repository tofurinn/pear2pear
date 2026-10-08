import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionDetailsModal from './session-details.tsx';

import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { AlertIcon, CalendarIcon, CheckIcon, ChevronLeft, ClockIcon } from '../../../../components/icons.tsx';
import { MOCK_REQUESTS, MOCK_SESSIONS, MOCK_VOLUNTEERS, buildSessionItems } from '../dashboards-utils.tsx';
import type { SessionItem } from '../dashboards-utils.tsx';
import { hourToSlot, toDateKey } from '../../session/session-utils.tsx';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

// ─── Session card (same markup in all three columns) ───────────────────────────

interface SessionCardProps {
  item: SessionItem;
  onViewDetails: () => void;
}

function SessionCard({ item, onViewDetails }: SessionCardProps) {
  const { tone, label } = item.status;

  return (
    <article className="ui-item-card">
      <span className="ui-category-tag">{item.category}</span>
      <h3 className="ui-item-card-title">{item.title}</h3>
      <p className="ui-item-card-person">{item.personName}</p>

      <div className="ui-item-card-footer">
        <span className="ui-item-card-date">{item.dateLabel}</span>
        <span className={`ui-status-pill ui-status-pill--${tone}`}>
          {tone === 'planned' ? <ClockIcon /> : tone === 'to-confirm' ? <AlertIcon /> : tone === 'confirmed' ? <CheckIcon /> : <CalendarIcon />} {label}
        </span>
        <button type="button" className="ui-chip-btn ui-chip-btn--info" onClick={onViewDetails}>
          View Details
        </button>
      </div>
    </article>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function MySessions() {
  const navigate = useNavigate();

  // TODO: load this student's sessions (and their requests / volunteers) from Firestore
  const [items, setItems] = useState<SessionItem[]>(() =>
    buildSessionItems(MOCK_SESSIONS, MOCK_REQUESTS, MOCK_VOLUNTEERS)
  );

  const planned = items.filter(item => item.sessStatus === 'Planned');
  const confirmed = items.filter(item => item.sessStatus === 'Confirmed');
  const toRate = items.filter(item => item.sessStatus === 'Completed'); // 'Rated' ones live in Support History

  const [selected, setSelected] = useState<SessionItem | null>(null);
  const handleViewDetails = (item: SessionItem) => setSelected(item);
  const handleFeedback = (item: SessionItem) => navigate(`/student/feedback-form/${item.sessID}`);

  const handleCancelSession = (item: SessionItem) => {
    setItems(previous => previous.map(session => session.sessID === item.sessID
      ? { ...session, sessStatus: 'Cancelled', status: { label: 'Cancelled', tone: 'cancelled' } }
      : session
    ));
    setSelected(null);
  };

  const handleConfirmArrangement = (item: SessionItem) => {
    setItems(previous => previous.map(session => session.sessID === item.sessID
      ? {
          ...session,
          sessStatus: 'Confirmed',
          studConfirmed: true,
          volConfirmed: true,
          status: { label: 'Confirmed', tone: 'confirmed' },
        }
      : session
    ));
    setSelected(null);
  };

  const handleRearrange = (item: SessionItem) => {
    const session = MOCK_SESSIONS.find(candidate => candidate.sessID === item.sessID);
    if (!session) return;

    navigate(`/student/my-sessions/${item.sessID}/edit`, {
      state: {
        formData: {
          reqID: session.reqID,
          sessDate: toDateKey(session.sessDate),
          sessTimeSlot: hourToSlot(session.sessTimeSlot.toDate().getHours()),
          supportMode: session.supportMode,
          meetingLocation: session.meetingLocation,
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

            <div className="dashboard-board dashboard-board--three dashboard-board--scroll-columns">
              <section>
                <h2 className="dashboard-section-title">Planned</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {planned.map(item => (
                    <SessionCard
                      key={item.sessID}
                      item={item}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {planned.length === 0 && <p className="dashboard-empty">No planned sessions</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Confirmed</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {confirmed.map(item => (
                    <SessionCard
                      key={item.sessID}
                      item={item}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {confirmed.length === 0 && <p className="dashboard-empty">No confirmed sessions</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">To Rate</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {toRate.map(item => (
                    <SessionCard
                      key={item.sessID}
                      item={item}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {toRate.length === 0 && <p className="dashboard-empty">Nothing to rate</p>}
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
          onRearrange={handleRearrange}
          onConfirmArrangement={handleConfirmArrangement}
        />
      )}
    </div>
  );
}

export default MySessions;