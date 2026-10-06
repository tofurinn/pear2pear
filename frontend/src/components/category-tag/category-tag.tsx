import type { ReactNode } from "react";

import "./category-tag.css";

type CategoryTagProps = {
  children: ReactNode;
  className?: string;
};

export default function CategoryTag({ children, className }: CategoryTagProps) {
  return <span className={["rf-tag", "rf-tag--static", className].filter(Boolean).join(" ")}>{children}</span>;
}
