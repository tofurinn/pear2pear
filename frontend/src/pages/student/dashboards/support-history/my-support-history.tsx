import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import SupportDetailsModal from './support-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import { MOCK_REQUESTS, MOCK_SESSIONS, MOCK_SESSION_FEEDBACK, MOCK_VOLUNTEERS, buildStudentSessionItems } from '../../student-utils.tsx';
import type { StudentSessionItem } from '../../student-utils.tsx';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

// ─── History card ──────────────────────────────────────────────────────────────

// Outline star so the Rated pill's icon takes the pill colour like the other pill icons
const StarOutlineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 2.6l2.8 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.8 3.3 1.3-6.5L2.6 9.4l6.6-.8z" />
  </svg>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

function SupportHistory({ dashboardPath = '/student/dashboard' }: { dashboardPath?: string }) {
  const navigate = useNavigate();

  // TODO: load this student's finished sessions from Firestore
  // History = sessions that are over: rated (completed unrated ones stay in My Sessions) or cancelled
  const history = useMemo(
    () =>
      buildStudentSessionItems(MOCK_SESSIONS, MOCK_REQUESTS, MOCK_VOLUNTEERS)
        .filter(item => item.sessStatus === 'Rated' || item.sessStatus === 'Cancelled')
        .sort((a, b) => b.sessDate.getTime() - a.sessDate.getTime()), // newest first
    []
  );

  const [selected, setSelected] = useState<StudentSessionItem | null>(null);
  const handleViewDetails = (item: StudentSessionItem) => setSelected(item);

  return (
    <div className="ui-page">
      <Navbar dashboardPath={dashboardPath} />
      <main className="student-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate(dashboardPath)}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--yellow">
              <div>
                <h1 className="dashboard-banner-title">Support History</h1>
                <p className="dashboard-banner-subtitle">Inactive Session History</p>
              </div>
            </header>

            <div className="dashboard-board dashboard-board--single dashboard-board--scroll-columns">
              <div className="dashboard-cards dashboard-cards--scroll">
                {history.map(item => (
                  <ItemCard
                    key={item.sessID}
                    category={item.category}
                    title={item.title}
                    personName={item.personName}
                    dateLabel={item.dateLabel}
                    pill={(
                      <StatusPill
                        tone={item.status.tone}
                        label={item.status.label}
                        icon={item.status.tone === 'rated' ? <StarOutlineIcon /> : undefined}
                      />
                    )}
                    onViewDetails={() => handleViewDetails(item)}
                  />
                ))}
                {history.length === 0 && <p className="dashboard-empty">No past sessions yet</p>}
              </div>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <SupportDetailsModal
          item={selected}
          feedback={MOCK_SESSION_FEEDBACK[selected.sessID]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default SupportHistory;