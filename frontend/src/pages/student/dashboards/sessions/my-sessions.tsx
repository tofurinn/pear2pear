import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionDetailsModal from './session-details.tsx';

import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import { MOCK_REQUESTS, MOCK_SESSIONS, MOCK_VOLUNTEERS, buildStudentSessionItems } from '../../student-utils.tsx';
import type { StudentSessionItem } from '../../student-utils.tsx';
import { hourToSlot, toDateKey } from '../../student-utils.tsx';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

// ─── Page ──────────────────────────────────────────────────────────────────────

function MySessions() {
  const navigate = useNavigate();

  // TODO: load this student's sessions (and their requests / volunteers) from Firestore
  const [items, setItems] = useState<StudentSessionItem[]>(() =>
    buildStudentSessionItems(MOCK_SESSIONS, MOCK_REQUESTS, MOCK_VOLUNTEERS)
  );

  const planned = items.filter(item => item.sessStatus === 'Planned');
  const confirmed = items.filter(item => item.sessStatus === 'Confirmed');
  const toRate = items.filter(item => item.sessStatus === 'Completed'); // 'Rated' ones live in Support History

  const [selected, setSelected] = useState<StudentSessionItem | null>(null);
  const handleViewDetails = (item: StudentSessionItem) => setSelected(item);
  const handleFeedback = (item: StudentSessionItem) => navigate(`/student/feedback-form/${item.sessID}`);

  const handleCancelSession = (item: StudentSessionItem) => {
    setItems(previous => previous.map(session => session.sessID === item.sessID
      ? { ...session, sessStatus: 'Cancelled', status: { label: 'Cancelled', tone: 'cancelled' } }
      : session
    ));
    setSelected(null);
  };

  const handleConfirmArrangement = (item: StudentSessionItem) => {
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

  const handleRearrange = (item: StudentSessionItem) => {
    const session = MOCK_SESSIONS.find(candidate => candidate.sessID === item.sessID);
    if (!session) return;

    navigate(`/student/session-edit/${item.sessID}`, {
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
                    <ItemCard
                      key={item.sessID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.dateLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
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
                    <ItemCard
                      key={item.sessID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.dateLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
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
                    <ItemCard
                      key={item.sessID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.dateLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
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