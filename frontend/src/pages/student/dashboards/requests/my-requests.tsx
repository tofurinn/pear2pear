import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RequestDetailsModal from './request-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import { MOCK_MY_REQUESTS, MOCK_VOLUNTEERS, buildRequestItems } from '../../student-utils.tsx';
import type { RequestItem } from '../../student-utils.tsx';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

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

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--blue">
              <div>
                <h1 className="dashboard-banner-title">My Requests</h1>
                <p className="dashboard-banner-subtitle">Don’t be afraid to receive aid!</p>
              </div>
              <button type="button" className="ui-btn ui-btn-white ui-btn-white--blue" onClick={() => navigate('/student/request-form')}>
                Request Support
              </button>
            </header>

            <div className="dashboard-board dashboard-board--three dashboard-board--scroll-columns">
              <section>
                <h2 className="dashboard-section-title">Pending</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {pending.map(item => (
                    <ItemCard
                      key={item.reqID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.dateLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {pending.length === 0 && <p className="dashboard-empty">No pending requests</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Accepted</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {accepted.map(item => (
                    <ItemCard
                      key={item.reqID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.dateLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                      onViewDetails={() => handleViewDetails(item)}
                    />
                  ))}
                  {accepted.length === 0 && <p className="dashboard-empty">No accepted requests</p>}
                </div>
              </section>

              <section>
                <h2 className="dashboard-section-title">Inactive</h2>
                <div className="dashboard-cards dashboard-cards--scroll">
                  {inactive.map(item => (
                    <ItemCard
                      key={item.reqID}
                      category={item.category}
                      title={item.title}
                      personName={item.personName}
                      dateLabel={item.dateLabel}
                      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
                      onViewDetails={() => handleViewDetails(item)}
                    />
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