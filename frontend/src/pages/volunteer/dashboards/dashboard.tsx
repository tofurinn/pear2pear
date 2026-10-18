import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/authContext";

import pearVolunteer from "../../../assets/images/volunteerpfp-cropped.png";
import Navbar from "../../../components/navbar/main-navbar";
import CategoryTag from "../../../components/category-tag/category-tag";
import { StarRating } from "../../../components/icons";
import { getRequestsByVolunteer } from "../../../services/RequestService";
import { getSessionsByRequestIDs } from "../../../services/SessionService";
import { getFeedbackBySession } from "../../../services/FeedbackService";
import { getVolunteer } from "../../../services/VolunteerService";
import type { Support_Request } from "../../../types/Support_Request";

import '../../../components/ui.css';
import '../../../components/page-css/dashboard.css';

type Stat = { label: string; value: number | string };

type HistoryItem = {
  id: string;
  category: Support_Request["category"];
  title: string;
  date: string;
  rating?: number;
};

interface VolunteerDashboardData {
  userUID: string;
  stats: Stat[];
  history: HistoryItem[];
  rating: number;
  ratingCount: number;
  error?: string;
}

const EMPTY_STATS: Stat[] = [
  { label: "Incoming Requests", value: 0 },
  { label: "Accepted Requests", value: 0 },
  { label: "Scheduled Sessions", value: 0 },
  { label: "Completed Sessions", value: 0 },
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

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDoc, loading: authLoading } = useAuth();
  const userUID = userDoc?.UID ?? null;
  const showRegistrationPrompt =
    (location.state as { showVolunteerRegistrationPrompt?: unknown } | null)
      ?.showVolunteerRegistrationPrompt === true;
  const [dashboardData, setDashboardData] = useState<VolunteerDashboardData | null>(null);
  const isLoading = authLoading || (!!userUID && dashboardData?.userUID !== userUID);
  const loadError = !authLoading && !userUID
    ? "Sign in to view your dashboard."
    : dashboardData?.userUID === userUID
      ? dashboardData.error ?? ""
      : "";
  const stats = dashboardData?.userUID === userUID ? dashboardData.stats : EMPTY_STATS.map(stat => ({ ...stat, value: "—" }));
  const rating = dashboardData?.userUID === userUID
    ? { rating: dashboardData.rating, count: dashboardData.ratingCount }
    : null;
  const history = dashboardData?.userUID === userUID ? dashboardData.history : [];

  useEffect(() => {
    if (authLoading || !userUID || showRegistrationPrompt) return;

    let isCurrent = true;
    const loadDashboard = async () => {
      try {
        const [requests, volunteer] = await Promise.all([
          getRequestsByVolunteer(userUID),
          getVolunteer(userUID),
        ]);
        const sessions = await getSessionsByRequestIDs(requests.map(request => request.reqID));
        const requestByID = new Map(requests.map(request => [request.reqID, request]));
        const finished = sessions
          .filter(session => session.sessStatus === "Rated" || session.sessStatus === "Cancelled")
          .sort((a, b) => b.sessDate.getTime() - a.sessDate.getTime())
          .slice(0, 3);

        const historyItems = (await Promise.all(finished.map(async session => {
          const request = requestByID.get(session.reqID);
          if (!request) return null;
          const feedback = session.sessStatus === "Rated"
            ? await getFeedbackBySession(session.sessID)
            : null;
          return {
            id: session.sessID,
            category: request.category,
            title: request.title,
            date: session.sessDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            ...(feedback ? { rating: feedback.rating } : {}),
          };
        }))).filter((item): item is HistoryItem => item !== null);

        if (isCurrent) {
          setDashboardData({
            userUID,
            stats: [
              { label: "Incoming Requests", value: requests.filter(request => request.reqStatus === "Pending").length },
              { label: "Accepted Requests", value: requests.filter(request => request.reqStatus === "Accepted").length },
              { label: "Scheduled Sessions", value: sessions.filter(session => session.sessStatus === "Planned" || session.sessStatus === "Confirmed").length },
              { label: "Completed Sessions", value: sessions.filter(session => session.sessStatus === "Completed" || session.sessStatus === "Rated").length },
            ],
            history: historyItems,
            rating: volunteer?.avgRating ?? 0,
            ratingCount: sessions.filter(session => session.sessStatus === "Rated").length,
          });
        }
      } catch (error) {
        console.error("Error loading volunteer dashboard:", error);
        if (isCurrent) {
          setDashboardData({
            userUID,
            stats: EMPTY_STATS.map(stat => ({ ...stat, value: "—" })),
            history: [],
            rating: 0,
            ratingCount: 0,
            error: "Could not load your dashboard. Please try again.",
          });
        }
      }
    };

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, showRegistrationPrompt, userUID]);

  return (
    <div className="dash dash--volunteer">
      <Navbar dashboardPath="/volunteer/dashboard" />

      <header className="dash-hero">
        <div className="dash-hero-inner">
          <img className="dash-avatar" src={pearVolunteer} alt="" />

          <div className="dash-identity">
            <div className="dash-name-row">
              <h1 className="dash-name">{userDoc?.name ?? (authLoading ? "Loading..." : "Volunteer")}</h1>
              <button
                type="button"
                className="dash-settings"
                aria-label="Account settings"
                onClick={() => navigate("/volunteer/settings")}
              >
                <GearIcon />
              </button>
            </div>

            <div className="dash-rating">
              {rating ? (
                <>
                  <StarRating rating={rating.rating} className="dash-rating-stars" />
                  <span className="dash-rating-text">{rating.rating.toFixed(1)} ({rating.count})</span>
                </>
              ) : (
                <span className="dash-rating-text">{isLoading ? "Loading rating..." : "—"}</span>
              )}
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
          {loadError && <p className="dash-load-error" role="alert">{loadError}</p>}
          {isLoading && <p className="dash-load-status" role="status">Loading dashboard...</p>}
          <h2 id="dash-journey-heading" className="dash-journey-heading">
            My Volunteer Journey
          </h2>

          <div className="dash-actions">
            <article
              className="dash-action dash-action--requests"
              role="link"
              tabIndex={0}
              aria-label="Open incoming requests"
              onClick={() => navigate('/volunteer/my-requests')}
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate('/volunteer/my-requests');
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
                    navigate('/volunteer/my-requests');
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
            {stats.map((stat, i) => (
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
            {history.map(item => (
              <li key={item.id} className="dash-history-item">
                <CategoryTag>{item.category}</CategoryTag>
                <h3 className="dash-history-title">{item.title}</h3>
                <div className="dash-history-meta">
                  <time className="dash-history-date">{item.date}</time>
                  {item.rating !== undefined && <StarRating rating={item.rating} className="dash-rating-stars" />}
                </div>
              </li>
            ))}
            {!isLoading && !loadError && history.length === 0 && (
              <li className="dash-history-empty">No support history yet</li>
            )}
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
