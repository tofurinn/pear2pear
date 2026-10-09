import type { ReactNode } from "react";

import "./category-tag.css";

type CategoryTagProps = {
  children: ReactNode;
  className?: string;
};

type CategoryTagButtonProps = CategoryTagProps & {
  selected: boolean;
  onClick: () => void;
};

export default function CategoryTag({ children, className }: CategoryTagProps) {
  return <span className={["category-tag", "category-tag--static", className].filter(Boolean).join(" ")}>{children}</span>;
}

export function CategoryTagButton({ children, className, selected, onClick }: CategoryTagButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={["category-tag", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
