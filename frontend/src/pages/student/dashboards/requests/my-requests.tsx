import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RequestDetailsModal from './request-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { CalendarIcon, CheckIcon, ChevronLeft, ClockIcon } from '../../../../components/icons.tsx';
import { MOCK_MY_REQUESTS, MOCK_VOLUNTEERS, buildRequestItems } from '../dashboards-utils.tsx';
import type { RequestItem } from '../dashboards-utils.tsx';

import '../../../../components/page-css/forms-ui.css';
import '../../../../components/page-css/subdashboards.css';

// ─── Request card (same markup in all three columns) ───────────────────────────

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

interface RequestCardProps {
  item: RequestItem;
  onViewDetails: () => void;
}

function RequestCard({ item, onViewDetails }: RequestCardProps) {
  const { tone, label } = item.status;

  return (
    <article className="ui-item-card">
      <span className="ui-category-tag">{item.category}</span>
      <h3 className="ui-item-card-title">{item.title}</h3>
      <p className="ui-item-card-person">{item.personName}</p>

      <div className="ui-item-card-footer">
        <span className="ui-item-card-date">{item.dateLabel}</span>
        <span className={`ui-status-pill ui-status-pill--${tone}`}>
          {tone === 'pending' ? <ClockIcon /> : tone === 'accepted' ? <CheckIcon /> : tone === 'scheduled' ? <CalendarIcon /> : <CloseIcon />} {label}
        </span>
        <button type="button" className="ui-chip-btn ui-chip-btn--info" onClick={onViewDetails}>
          View Details
        </button>
      </div>
    </article>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function MyRequests() {
  const navigate = useNavigate();

  // TODO: load this student's requests (and the volunteers' names) from Firestore
  const items = useMemo(() => buildRequestItems(MOCK_MY_REQUESTS, MOCK_VOLUNTEERS), []);

  const pending = items.filter(item => item.reqStatus === 'Pending');
  const accepted = items.filter(item => item.reqStatus === 'Accepted');
  // Inactive = no longer waiting on anything: already turned into a session, rejected, or cancelled
  const inactive = items.filter(item => ['Scheduled', 'Rejected', 'Cancelled'].includes(item.reqStatus));

  const [selected, setSelected] = useState<RequestItem | null>(null);
  const handleViewDetails = (item: RequestItem) => setSelected(item);

  return (
    <div className="ui-page">
      <Navbar />
      <main className="student-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/student/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card">
            <header className="dashboard-banner dashboard-banner--blue">
              <div>
                <h1 className="dashboard-banner-title">My Requests</h1>
                <p className="dashboard-banner-subtitle">Don’t be afraid to receive aid!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white ui-btn-white--blue" onClick={() => navigate('/student/request-form')}>
                Request Support
              </button>
            </header>

            <div className="dashboard-board dashboard-board--three">
              <section>
                <h2 className="dashboard-section-title">Pending</h2>
                <div className="dashboard-cards">
                  {pending.map(item => (
                    <RequestCard key={item.reqID} item={item} onViewDetails={() => handleViewDetails(item)} />
                  ))}
                  {pending.length === 0 && <p className="dashboard-empty">No pending requests</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Accepted</h2>
                <div className="dashboard-cards">
                  {accepted.map(item => (
                    <RequestCard key={item.reqID} item={item} onViewDetails={() => handleViewDetails(item)} />
                  ))}
                  {accepted.length === 0 && <p className="dashboard-empty">No accepted requests</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Inactive</h2>
                <div className="dashboard-cards">
                  {inactive.map(item => (
                    <RequestCard key={item.reqID} item={item} onViewDetails={() => handleViewDetails(item)} />
                  ))}
                  {inactive.length === 0 && <p className="dashboard-empty">No inactive requests</p>}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <RequestDetailsModal
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default MyRequests;