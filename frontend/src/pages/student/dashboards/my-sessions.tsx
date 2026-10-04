import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Support_Session } from '../../../types/Support_Session';

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { CalendarIcon, CheckIcon, ChevronLeft, ClockIcon } from '../../../components/icons.tsx';
import { MOCK_REQUESTS, MOCK_SESSIONS, MOCK_VOLUNTEERS, buildSessionItems } from './SESSION-MOCK.tsx';
import type { SessionItem } from './SESSION-MOCK.tsx';

import '../../../components/forms-ui.css';
import '../../../components/dashboards.css';

// ─── Session card (same markup in all three columns) ───────────────────────────

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M4 20l1-4L16.5 4.5a2 2 0 013 3L8 19l-4 1zM14 7l3 3" />
  </svg>
);

interface SessionCardProps {
  item: SessionItem;
  onViewDetails: () => void;
  onEdit?: () => void;     // shows the pencil when given
}

function SessionCard({ item, onViewDetails, onEdit }: SessionCardProps) {
  const { tone, label } = item.status;

  return (
    <article className="ui-item-card">
      {onEdit && (
        <button type="button" className="ui-item-card-edit" aria-label={`Edit ${item.title}`} onClick={onEdit}>
          <PencilIcon />
        </button>
      )}

      <span className="ui-category-tag">{item.category}</span>
      <h3 className="ui-item-card-title">{item.title}</h3>
      <p className="ui-item-card-person">{item.personName}</p>

      <div className="ui-item-card-footer">
        <span className="ui-item-card-date">{item.dateLabel}</span>
        <span className={`ui-status-pill ui-status-pill--${tone}`}>
          {tone === 'planned' ? <ClockIcon /> : tone === 'confirmed' ? <CheckIcon /> : <CalendarIcon />} {label}
        </span>
        <button type="button" className="ui-chip-btn ui-chip-btn--info ui-chip-btn--block" onClick={onViewDetails}>
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
  const handleEdit = (item: SessionItem) => navigate(`/sessions/${item.sessID}/edit`);   // TODO: your edit route

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
                      onEdit={() => handleEdit(item)}
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
                      onEdit={() => handleEdit(item)}
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