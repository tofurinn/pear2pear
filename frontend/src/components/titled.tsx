import type { ReactNode } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Titled({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(title);
  return <>{children}</>;
}