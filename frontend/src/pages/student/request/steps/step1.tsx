import { CATEGORIES } from '../request-utils.tsx';
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
  const canContinue =
    formData.category !== '' && formData.title.trim() !== '' && formData.description.trim() !== '';

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
            className="ui-field-control"
            value={formData.title}
            placeholder="e.g. Need Help with "
            onChange={e => updateFormData({ title: e.target.value })}
          />
        </div>

        <div className="ui-field">
          <label className="ui-field-label" htmlFor="reqDescription">Request Description</label>
          <textarea
            id="reqDescription"
            className="ui-field-control rf-textarea"
            value={formData.description}
            placeholder="Tell the volunteer what you need help with"
            onChange={e => updateFormData({ description: e.target.value })}
          />
        </div>
      </div>

      <StepNav onNext={onNext} nextDisabled={!canContinue} />
    </>
  );
}

export default SupportTypeStep;