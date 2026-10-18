
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import pearStudent from "../../../assets/images/studentpfp-cropped.png";
import Navbar from "../../../components/navbar/main-navbar";
import CategoryTag from "../../../components/category-tag/category-tag";
import { getRequestsByStudent } from "../../../services/RequestService";
import { getSessionsByRequestIDs } from "../../../services/SessionService";
import { getFeedbackBySession } from "../../../services/FeedbackService";
import type { Support_Request } from "../../../types/Support_Request";

import '../../../components/page-css/dashboard.css';

type Stat = { label: string; value: number | string };

type HistoryItem = {
  id: string;
  category: Support_Request["category"];
  title: string;
  date: string;
  rating?: number;
};

interface StudentDashboardData {
  userUID: string;
  stats: Stat[];
  history: HistoryItem[];
  error?: string;
}

type DashboardProps = {
  onRequestSupport?: () => void;
  onScheduleSession?: () => void;
  onOpenSessions?: () => void;
  onOpenSettings?: () => void;
  onViewMoreHistory?: () => void;
};

const EMPTY_STATS: Stat[] = [
  { label: "Requested Supports", value: 0 },
  { label: "Accepted Requests", value: 0 },
  { label: "Scheduled Sessions", value: 0 },
  { label: "Completed Sessions", value: 0 },
];

/* ---------- Small pieces ---------- */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="dash-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, rating - i)) * 100;
        return (
          <span
            key={i}
            className="dash-star"
            style={{ ["--fill" as string]: `${fill}%` }}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </span>
  );
}

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

/* ---------- Page ---------- */

export default function StudentDashboard({
  onRequestSupport,
  onScheduleSession,
  onOpenSessions,
  onOpenSettings,
  onViewMoreHistory,
}: DashboardProps) {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const userUID = userDoc?.UID ?? null;
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const isLoading = authLoading || (!!userUID && dashboardData?.userUID !== userUID);
  const loadError = !authLoading && !userUID
    ? "Sign in to view your dashboard."
    : dashboardData?.userUID === userUID
      ? dashboardData.error ?? ""
      : "";
  const stats = dashboardData?.userUID === userUID ? dashboardData.stats : EMPTY_STATS.map(stat => ({ ...stat, value: "—" }));
  const history = dashboardData?.userUID === userUID ? dashboardData.history : [];

  useEffect(() => {
    if (authLoading || !userUID) return;

    let isCurrent = true;
    const loadDashboard = async () => {
      try {
        const requests = await getRequestsByStudent(userUID);
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
              { label: "Requested Supports", value: requests.length },
              { label: "Accepted Requests", value: requests.filter(request => request.reqStatus === "Accepted").length },
              { label: "Scheduled Sessions", value: sessions.filter(session => session.sessStatus === "Planned" || session.sessStatus === "Confirmed").length },
              { label: "Completed Sessions", value: sessions.filter(session => session.sessStatus === "Completed" || session.sessStatus === "Rated").length },
            ],
            history: historyItems,
          });
        }
      } catch (error) {
        console.error("Error loading student dashboard:", error);
        if (isCurrent) {
          setDashboardData({
            userUID,
            stats: EMPTY_STATS.map(stat => ({ ...stat, value: "—" })),
            history: [],
            error: "Could not load your dashboard. Please try again.",
          });
        }
      }
    };

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, userUID]);

  return (
    <div className="dash">
      <Navbar />

      {/* ---- Hero ---- */}
      <header className="dash-hero">
        <div className="dash-hero-inner">
          <img
            className="dash-avatar"
            src={pearStudent}
            alt=""
          />

          <div className="dash-identity">
            <div className="dash-name-row">
              <h1 className="dash-name">{userDoc?.name ?? (authLoading ? "Loading..." : "Student")}</h1>
              <button
                type="button"
                className="dash-settings"
                aria-label="Account settings"
                onClick={onOpenSettings ?? (() => navigate("/student/settings"))}
              >
                <GearIcon />
              </button>
            </div>

            <div className="dash-toggle" role="group" aria-label="Dashboard mode">
              <button
                type="button"
                className="dash-toggle-btn"
                aria-pressed="true"
                onClick={() => navigate("/student/dashboard")}
              >
                Student
              </button>
              <button
                type="button"
                className="dash-toggle-btn"
                aria-pressed="false"
                onClick={() => navigate("/volunteer/dashboard")}
              >
                Volunteer
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Body ---- */}
      <main className="dash-body">
        <section className="dash-journey" aria-labelledby="dash-journey-heading">
          {loadError && <p className="dash-load-error" role="alert">{loadError}</p>}
          {isLoading && <p className="dash-load-status" role="status">Loading dashboard...</p>}
          <h2 id="dash-journey-heading" className="dash-journey-heading">
            My Support Journey
          </h2>

          <div className="dash-actions">
            {/* Requests / Incoming requests card */}
            <article
              className="dash-action dash-action--requests"
              role="link"
              tabIndex={0}
              aria-label="Open my requests"
              onClick={() => navigate("/student/my-requests")}
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/student/my-requests");
                }
              }}
            >
              <div className="dash-action-head">
                <h3 className="dash-action-title">
                  My Requests
                </h3>
                <button
                  type="button"
                  className="dash-action-arrow"
                  aria-label="Open my requests"
                  onClick={event => {
                    event.stopPropagation();
                    navigate("/student/my-requests");
                  }}
                >
                  <ChevronRight />
                </button>
              </div>
              <p className="dash-action-sub">
                Don’t be afraid to receive aid!
              </p>
              <button
                type="button"
                className="dash-pill dash-pill--teal"
                onClick={event => {
                  event.stopPropagation();
                  if (onRequestSupport) {
                    onRequestSupport();
                  } else {
                    navigate("/student/request-form");
                  }
                }}
              >
                Request Support
              </button>
            </article>

            {/* Sessions card (same in both modes) */}
            <article
              className="dash-action dash-action--sessions"
              role="link"
              tabIndex={0}
              aria-label="Open my sessions"
              onClick={() => {
                if (onOpenSessions) {
                  onOpenSessions();
                } else {
                  navigate("/student/my-sessions");
                }
              }}
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (onOpenSessions) {
                    onOpenSessions();
                  } else {
                    navigate("/student/my-sessions");
                  }
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
                    if (onOpenSessions) {
                      onOpenSessions();
                    } else {
                      navigate("/student/my-sessions");
                    }
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
                  if (onScheduleSession) {
                    onScheduleSession();
                  } else {
                    navigate("/student/session-form");
                  }
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
                  {item.rating !== undefined && <Stars rating={item.rating} />}
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
            onClick={() => (onViewMoreHistory ? onViewMoreHistory() : navigate("/student/my-support-history"))}
          >
            View More
            <ChevronRight />
          </button>
        </aside>
      </main>
    </div>
  );
}