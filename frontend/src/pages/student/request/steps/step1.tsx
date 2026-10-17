import {
  CATEGORIES,
  isStepValid,
  MAX_REQUEST_DESCRIPTION_LENGTH,
  MAX_REQUEST_TITLE_LENGTH,
} from '../request-utils.tsx';
import type { RequestFormData } from '../request-utils.tsx';
import { StepNav } from '../request-ui.tsx';
import { CategoryTagButton } from '../../../../components/category-tag/category-tag.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step1Props {
  formData: Pick<RequestFormData, 'category' | 'title' | 'description'>;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function SupportTypeStep({ formData, updateFormData, onNext }: Step1Props) {
  const titleTooLong = formData.title.length > MAX_REQUEST_TITLE_LENGTH;
  const descriptionTooLong = formData.description.length > MAX_REQUEST_DESCRIPTION_LENGTH;
  const titleWhitespaceOnly = formData.title.length > 0 && formData.title.trim() === '';
  const descriptionWhitespaceOnly = formData.description.length > 0 && formData.description.trim() === '';
  const titleInvalid = titleTooLong || titleWhitespaceOnly;
  const descriptionInvalid = descriptionTooLong || descriptionWhitespaceOnly;
  const canContinue = isStepValid('supportType', formData);

  return (
    <>
      <h2 className="ui-card-heading">Step 1: Support Type</h2>

      <div className="ui-card-body ui-field-stack">
        <div className="ui-field">
          <span className="ui-field-label" id="category-label">Support Category</span>
          <div
            className="ui-field-control rf-tag-field"
            role="radiogroup"
            aria-labelledby="category-label"
          >
            {CATEGORIES.map(category => (
              <CategoryTagButton
                key={category}
                selected={formData.category === category}
                onClick={() => updateFormData({ category })}
              >
                {category}
              </CategoryTagButton>
            ))}
          </div>
        </div>

        <div className="ui-field">
          <label className="ui-field-label" htmlFor="reqTitle">Request Title</label>
          <input
            id="reqTitle"
            type="text"
            className={`ui-field-control ${titleInvalid ? 'ui-field-control--error' : ''}`.trim()}
            value={formData.title}
            placeholder="e.g. Need Help with "
            aria-invalid={titleInvalid}
            aria-describedby={titleInvalid ? 'reqTitle-error' : undefined}
            onChange={e => updateFormData({ title: e.target.value })}
          />
          {titleInvalid && (
            <p id="reqTitle-error" className="ui-field-error" role="alert">
              {titleTooLong
                ? `Maximum ${MAX_REQUEST_TITLE_LENGTH} characters (${formData.title.length}/${MAX_REQUEST_TITLE_LENGTH}).`
                : 'Please enter a title, not just spaces.'}
            </p>
          )}
        </div>

        <div className="ui-field">
          <label className="ui-field-label" htmlFor="reqDescription">Request Description</label>
          <textarea
            id="reqDescription"
            className={`ui-field-control rf-textarea ${descriptionInvalid ? 'ui-field-control--error' : ''}`.trim()}
            value={formData.description}
            placeholder="Tell the volunteer what you need help with"
            aria-invalid={descriptionInvalid}
            aria-describedby={descriptionInvalid ? 'reqDescription-error' : undefined}
            onChange={e => updateFormData({ description: e.target.value })}
          />
          {descriptionInvalid && (
            <p id="reqDescription-error" className="ui-field-error" role="alert">
              {descriptionTooLong
                ? `Maximum ${MAX_REQUEST_DESCRIPTION_LENGTH} characters (${formData.description.length}/${MAX_REQUEST_DESCRIPTION_LENGTH}).`
                : 'Please enter a description, not just spaces.'}
            </p>
          )}
        </div>
      </div>

      <StepNav onNext={onNext} nextDisabled={!canContinue} />
    </>
  );
}

export default SupportTypeStep;