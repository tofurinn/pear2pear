import type { ReactNode } from "react";

import "./category-tag.css";

type CategoryTagProps = {
  children: ReactNode;
};

export default function CategoryTag({ children }: CategoryTagProps) {
  return <span className="rf-tag rf-tag--static">{children}</span>;
}
