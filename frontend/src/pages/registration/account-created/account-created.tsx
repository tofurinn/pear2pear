import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../../components/navbar/global-navbar";
import "../register.css";

import pearHeart from "../../../assets/images/pearheart.png";

export default function AccountCreatedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Allow upstream pages to say where "Continue" should land.
  // Default = student dashboard.
  const next = (location.state as { next?: string } | null)?.next
    ?? "/student/dashboard";

  return (
    <div className="pass-page">
      <Navbar />

      <main className="pass-main">
        <section className="pass-card success-card">
          <img
            src={pearHeart}
            alt=""
            className="success-card__icon"
            aria-hidden="true"
          />

          <h1 className="pass-card__title success-card__title">
            You're all set!
          </h1>

          <p className="pass-card__text success-card__text">
            Your account is ready. Continue to your dashboard to begin exploring!
          </p>

          <button
            type="button"
            className="pass-btn success-card__btn"
            onClick={() => navigate(next, { replace: true })}
          >
            Continue to Dashboard
          </button>
        </section>
      </main>
    </div>
  );
}