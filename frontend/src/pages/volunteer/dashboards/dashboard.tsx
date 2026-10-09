import { useLocation, useNavigate } from "react-router-dom";

import pearVolunteer from "../../../assets/images/volunteerpfp-cropped.png";
import Navbar from "../../../components/navbar/main-navbar";
import CategoryTag from "../../../components/category-tag/category-tag";
import { StarRating } from "../../../components/icons";

import '../../../components/ui.css';
import '../../../components/page-css/dashboard.css';

type Stat = { label: string; value: number };

type HistoryItem = {
  id: string;
  category: string;
  title: string;
  date: string;
  rating: number;
};

type VolunteerDashboardProps = {
  userName?: string;
  volunteerRating?: { rating: number; count: number };
  onOpenRequests?: () => void;
  onOpenSettings?: () => void;
};

const STATS: Stat[] = [
  { label: "Incoming Requests", value: 2 },
  { label: "Accepted Requests", value: 3 },
  { label: "Scheduled Sessions", value: 2 },
  { label: "Completed Sessions", value: 2 },
];

const HISTORY: HistoryItem[] = [
  {
    id: "1",
    category: "General Student Support",
    title: "Matcha-making for Bazaar",
    date: "13 March 2025",
    rating: 4.5,
  },
  {
    id: "2",
    category: "Technology Support",
    title: "RANSOMWARE IN MY DEVICE",
    date: "25 Apr 2024",
    rating: 5,
  },
  {
    id: "3",
    category: "Academic Support",
    title: "Presentation Practice",
    date: "24 Jan 2024",
    rating: 4.5,
  },
];

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.8l1.6 2.1 2.6-.5.9 2.5 2.5.9-.5 2.6L21.2 12l-2.1 1.6.5 2.6-2.5.9-.9 2.5-2.6-.5L12 21.2l-1.6-2.1-2.6.5-.9-2.5-2.5-.9.5-2.6L2.8 12l2.1-1.6-.5-2.6 2.5-.9.9-2.5 2.6.5L12 2.8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VolunteerDashboard({
  userName = "Freddy Fazbear",
  volunteerRating = { rating: 4, count: 2 },
  onOpenRequests,
  onOpenSettings,
}: VolunteerDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const showRegistrationPrompt =
    (location.state as { showVolunteerRegistrationPrompt?: unknown } | null)
      ?.showVolunteerRegistrationPrompt === true;

  return (
    <div className="dash dash--volunteer">
      <Navbar dashboardPath="/volunteer/dashboard" />

      <header className="dash-hero">
        <div className="dash-hero-inner">
          <img className="dash-avatar" src={pearVolunteer} alt="" />

          <div className="dash-identity">
            <div className="dash-name-row">
              <h1 className="dash-name">{userName}</h1>
              {onOpenSettings && (
                <button
                  type="button"
                  className="dash-settings"
                  aria-label="Account settings"
                  onClick={onOpenSettings}
                >
                  <GearIcon />
                </button>
              )}
            </div>

            <div className="dash-rating">
              <StarRating rating={volunteerRating.rating} className="dash-rating-stars" />
              <span className="dash-rating-text">
                {volunteerRating.rating.toFixed(1)} ({volunteerRating.count})
              </span>
            </div>

            <div className="dash-toggle" role="group" aria-label="Dashboard mode">
              <button
                type="button"
                className="dash-toggle-btn"
                aria-pressed="false"
                onClick={() => navigate("/student/dashboard")}
              >
                Student
              </button>
              <button
                type="button"
                className="dash-toggle-btn"
                aria-pressed="true"
                onClick={() => navigate("/volunteer/dashboard")}
              >
                Volunteer
              </button>
            </div>
          </div>
        </div>
      </header>

      {showRegistrationPrompt ? (
        <main className="dash-volunteer-registration">
          <section className="dash-volunteer-registration__card" aria-labelledby="volunteer-registration-title">
            <h2 id="volunteer-registration-title">Oops!...</h2>
            <p>Looks like you’re not a volunteer?<br />Come join the family now!</p>
            <button
              type="button"
              className="dash-volunteer-registration__button"
              onClick={() => navigate("/volunteer-registration")}
            >
              Join as Volunteer
            </button>
          </section>
        </main>
      ) : (
      <main className="dash-body">
        <section className="dash-journey" aria-labelledby="dash-journey-heading">
          <h2 id="dash-journey-heading" className="dash-journey-heading">
            My Volunteer Journey
          </h2>

          <div className="dash-actions">
            <article
              className="dash-action dash-action--requests"
              role="link"
              tabIndex={0}
              aria-label="Open incoming requests"
              onClick={onOpenRequests ?? (() => navigate('/volunteer/my-requests'))}
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  (onOpenRequests ?? (() => navigate('/volunteer/my-requests')))();
                }
              }}
            >
              <div className="dash-action-head">
                <h3 className="dash-action-title">Incoming Requests</h3>
                <button
                  type="button"
                  className="dash-action-arrow"
                  aria-label="Open incoming requests"
                  onClick={event => {
                    event.stopPropagation();
                    (onOpenRequests ?? (() => navigate('/volunteer/my-requests')))();
                  }}
                >
                  <ChevronRight />
                </button>
              </div>
              <p className="dash-action-sub">Check in to see which pear needs you!</p>
            </article>
            <article
              className="dash-action dash-action--sessions"
              role="link"
              tabIndex={0}
              aria-label="Open my sessions"
              onClick={() => navigate("/volunteer/my-sessions")}
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/volunteer/my-sessions");
                }
              }}
            >
              <div className="dash-action-head">
                <h3 className="dash-action-title">My Sessions</h3>
                <button
                  type="button"
                  className="dash-action-arrow"
                  aria-label="Open my sessions"
                  onClick={event => {
                    event.stopPropagation();
                    navigate("/volunteer/my-sessions");
                  }}
                >
                  <ChevronRight />
                </button>
              </div>
              <p className="dash-action-sub">Make these sessions count</p>
              <button
                type="button"
                className="dash-pill dash-pill--green"
                onClick={event => {
                  event.stopPropagation();
                  navigate("/volunteer/session-form");
                }}
              >
                Schedule Session
              </button>
            </article>
          </div>

          <ul className="dash-stats">
            {STATS.map((stat, i) => (
              <li key={stat.label} className={`dash-stat dash-stat--${i + 1}`}>
                <span className="dash-stat-label">{stat.label}</span>
                <span className="dash-stat-value">{stat.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="dash-history" aria-labelledby="dash-history-heading">
          <h2 id="dash-history-heading" className="dash-history-heading">
            Support History
          </h2>

          <ul className="dash-history-list">
            {HISTORY.map(item => (
              <li key={item.id} className="dash-history-item">
                <CategoryTag>{item.category}</CategoryTag>
                <h3 className="dash-history-title">{item.title}</h3>
                <div className="dash-history-meta">
                  <time className="dash-history-date">{item.date}</time>
                  <StarRating rating={item.rating} className="dash-rating-stars" />
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="dash-more"
            onClick={() => navigate("/volunteer/my-support-history")}
          >
            View More
            <ChevronRight />
          </button>
        </aside>
      </main>
      )}
    </div>
  );
}
