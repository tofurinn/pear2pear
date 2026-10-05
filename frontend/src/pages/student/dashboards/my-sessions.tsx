import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { CalendarIcon, CheckIcon, ChevronLeft, ClockIcon } from '../../../components/icons.tsx';
import { MOCK_REQUESTS, MOCK_SESSIONS, MOCK_VOLUNTEERS, buildSessionItems } from './SESSION-MOCK.tsx';
import type { SessionItem } from './SESSION-MOCK.tsx';

import '../../../components/forms-ui.css';
import '../../../components/dashboards.css';

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
          {tone === 'planned' ? <ClockIcon /> : tone === 'confirmed' ? <CheckIcon /> : <CalendarIcon />} {label}
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
  const items = useMemo(() => buildSessionItems(MOCK_SESSIONS, MOCK_REQUESTS, MOCK_VOLUNTEERS), []);

  const planned = items.filter(item => item.sessStatus === 'Planned');
  const confirmed = items.filter(item => item.sessStatus === 'Confirmed');
  const toRate = items.filter(item => item.sessStatus === 'Completed'); // 'Rated' ones live in Support History

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
            <header className="dashboard-banner dashboard-banner--green">
              <div>
                <h1 className="dashboard-banner-title">My Sessions</h1>
                <p className="dashboard-banner-subtitle">Track your sessions!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white" onClick={() => navigate('/session-form')}>
                Schedule Session
              </button>
            </header>

            <div className="dashboard-board dashboard-board--three">
              <section>
                <h2 className="dashboard-section-title">Planned</h2>
                <div className="dashboard-cards">
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
                <div className="dashboard-cards">
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
                <div className="dashboard-cards">
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
    </div>
  );
}

export default MySessions;