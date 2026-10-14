import heartFinger from "../../../../assets/images/heart-finger.png";
import "./request-confirmation.css";
import type { RequestSummary } from "../request-utils.tsx";
import CategoryTag from "../../../../components/category-tag/category-tag.tsx";

type StepConfirmationProps = {
  summary: RequestSummary;
  onReturnToDashboard: () => void;
  onViewRequests: () => void;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="rf-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, rating - i)) * 100;
        return (
          <span
            key={i}
            className="rf-star"
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

export default function StepConfirmation({
  summary,
  onReturnToDashboard,
  onViewRequests,
}: StepConfirmationProps) {
  const { volunteer } = summary;

  return (
    <div className="ui-confirmation">
      <img className="ui-confirmation-icon" src={heartFinger} alt="" />

      <h1 className="ui-confirmation-title">Your Support Request Is Submitted!</h1>
      <p className="ui-confirmation-message">
        Sit tight, you will receive a notification once your matched Volunteer
        accepts the request
      </p>

      <section className="rf-summary" aria-labelledby="rf-summary-heading">

        <div className="rf-confirm-summary-panel">
          <CategoryTag className="rf-confirm-summary-tag">{summary.category}</CategoryTag>
          <h3 className="rf-confirm-summary-title">{summary.title}</h3>
          <p className="rf-confirm-summary-description">{summary.description}</p>

          <div className="rf-confirm-volunteer">
            <div className="rf-confirm-volunteer-header">
              <span className="rf-confirm-volunteer-name">{volunteer.name}</span>
              <Stars rating={volunteer.rating} />
              <span className="rf-confirm-volunteer-rating">
                {volunteer.rating}
              </span>
            </div>
            <div className="rf-confirm-volunteer-traits">
              {volunteer.skills.join(" • ")}
            </div>
          </div>
        </div>
      </section>

      <div className="ui-confirmation-actions">
        <button type="button" className="ui-btn ui-btn-solid" onClick={onReturnToDashboard}>
          Return to Dashboard
        </button>
        <button type="button" className="ui-btn ui-btn-outline" onClick={onViewRequests}>
          View Requests
        </button>
      </div>
    </div>
  );
}
