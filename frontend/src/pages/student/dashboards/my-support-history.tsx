import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { CalendarIcon, ChevronLeft } from '../../../components/icons.tsx';
import { MOCK_REQUESTS, MOCK_SESSIONS, MOCK_VOLUNTEERS, buildSessionItems } from './SESSION-MOCK.tsx';
import type { SessionItem } from './SESSION-MOCK.tsx';

import '../../../components/forms-ui.css';
import '../../../components/dashboards.css';

// ─── History card ──────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

// Outline star so the Rated pill's icon takes the pill colour like the other pill icons
const StarOutlineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 2.6l2.8 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.8 3.3 1.3-6.5L2.6 9.4l6.6-.8z" />
  </svg>
);

interface HistoryCardProps {
  item: SessionItem;
  onViewDetails: () => void;
}

function HistoryCard({ item, onViewDetails }: HistoryCardProps) {
  const { tone, label } = item.status;

  return (
    <article className="ui-item-card">
      <span className="ui-category-tag">{item.category}</span>
      <h3 className="ui-item-card-title">{item.title}</h3>
      <p className="ui-item-card-person">{item.personName}</p>

      <div className="ui-item-card-footer">
        <span className="ui-item-card-date">{item.dateLabel}</span>
        <span className={`ui-status-pill ui-status-pill--${tone}`}>
          {tone === 'cancelled' ? <CloseIcon /> : tone === 'rated' ? <StarOutlineIcon /> : <CalendarIcon />} {label}
        </span>
        <button type="button" className="ui-chip-btn ui-chip-btn--info" onClick={onViewDetails}>
          View Details
        </button>
      </div>
    </article>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function SupportHistory() {
  const navigate = useNavigate();

  // TODO: load this student's finished sessions from Firestore
  // History = sessions that are over: rated (completed unrated ones stay in My Sessions) or cancelled
  const history = useMemo(
    () =>
      buildSessionItems(MOCK_SESSIONS, MOCK_REQUESTS, MOCK_VOLUNTEERS)
        .filter(item => item.sessStatus === 'Rated' || item.sessStatus === 'Cancelled')
        .sort((a, b) => b.sessDate.getTime() - a.sessDate.getTime()), // newest first
    []
  );

  const handleViewDetails = (item: SessionItem) => navigate(`/sessions/${item.sessID}`); // TODO: your details route

  return (
    <div className="ui-page">
      <Navbar />
      <main className="dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/student/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card">
            <header className="dashboard-banner dashboard-banner--yellow">
              <div>
                <h1 className="dashboard-banner-title">Support History</h1>
                <p className="dashboard-banner-subtitle">Inactive Session History</p>
              </div>
            </header>

            <div className="dashboard-board dashboard-board--single">
              <div className="dashboard-cards">
                {history.map(item => (
                  <HistoryCard key={item.sessID} item={item} onViewDetails={() => handleViewDetails(item)} />
                ))}
                {history.length === 0 && <p className="dashboard-empty">No past sessions yet</p>}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SupportHistory;