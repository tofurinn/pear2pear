import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import SupportDetailsModal from './support-details.tsx';
import Navbar from '../../../../components/navbar/main-navbar.tsx';
import { ChevronLeft } from '../../../../components/icons.tsx';
import { ItemCard, StatusPill } from '../volunteer-shared.tsx';
import { MOCK_VOLUNTEER_HISTORY } from '../volunteer-utils.ts';
import type { VolunteerSessionItem } from '../volunteer-utils.ts';

import '../../../../components/ui.css';
import '../../../../components/page-css/subdashboards.css';

function VolunteerHistory() {
  const navigate = useNavigate();

  // TODO: load this volunteer's finished sessions (rated or cancelled) from Firestore
  const history = [...MOCK_VOLUNTEER_HISTORY].sort((a, b) => b.sessDate.getTime() - a.sessDate.getTime());
  const [selected, setSelected] = useState<VolunteerSessionItem | null>(null);

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

          <section className="dashboard-card dashboard-card--scroll-columns">
            <header className="dashboard-banner dashboard-banner--yellow">
              <div>
                <h1 className="dashboard-banner-title">Support History</h1>
                <p className="dashboard-banner-subtitle">Completed and cancelled sessions</p>
              </div>
            </header>

            <div className="dashboard-board dashboard-board--single dashboard-board--scroll-columns">
              <div className="dashboard-cards dashboard-cards--scroll">
                {history.map(renderCard)}
                {history.length === 0 && <p className="dashboard-empty">No past sessions yet</p>}
              </div>
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