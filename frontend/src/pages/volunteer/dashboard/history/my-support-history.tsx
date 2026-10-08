import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import SupportDetailsModal from './support-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { BoardSection, ItemCard, StatusPill } from '../volunteer-shared.tsx';
import { MOCK_VOLUNTEER_HISTORY } from '../volunteer-utils.ts';
import type { VolunteerSessionItem } from '../volunteer-utils.ts';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

function VolunteerHistory() {
  const navigate = useNavigate();

  // TODO: load this volunteer's finished sessions (rated or cancelled) from Firestore
  const items = MOCK_VOLUNTEER_HISTORY;
  const [selected, setSelected] = useState<VolunteerSessionItem | null>(null);

  const completed = items.filter(item => item.sessStatus === 'Rated');
  const inactive = items.filter(item => item.sessStatus === 'Cancelled');

  const renderCard = (item: VolunteerSessionItem) => (
    <ItemCard
      key={item.sessID}
      category={item.category}
      title={item.title}
      personName={item.personName}
      dateLabel={item.dateLabel}
      rating={item.volunteerRating}
      pill={<StatusPill tone={item.status.tone} label={item.status.label} />}
      onViewDetails={() => setSelected(item)}
    />
  );

  return (
    <div className="ui-page">
      <Navbar dashboardPath="/volunteer/dashboard" />
      <main className="volunteer-dashboard-background">
        <div className="dashboard-inner">
          <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate('/volunteer/dashboard')}>
            <ChevronLeft /> Dashboard
          </button>

          <section className="dashboard-card">
            <header className="dashboard-banner dashboard-banner--yellow">
              <div>
                <h1 className="dashboard-banner-title">Support History</h1>
                <p className="dashboard-banner-subtitle">Completed and cancelled sessions</p>
              </div>
            </header>

            {/* Wide left column with two cards per row, narrow right column */}
            <div className="dashboard-board dashboard-board--history">
              <BoardSection
                title="Completed"
                count={completed.length}
                emptyText="No completed sessions"
                cardsClassName="dashboard-cards--two"
              >
                {completed.map(renderCard)}
              </BoardSection>

              <BoardSection title="Inactive" count={inactive.length} emptyText="No cancelled sessions">
                {inactive.map(renderCard)}
              </BoardSection>
            </div>
          </section>
        </div>
      </main>

      {selected && (
        <SupportDetailsModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default VolunteerHistory;