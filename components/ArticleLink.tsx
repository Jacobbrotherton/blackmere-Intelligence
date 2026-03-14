"use client";

import { Article } from "@/lib/news";

interface Props {
  article: Article;
  className?: string;
  children: React.ReactNode;
}

export default function ArticleLink({ article, className, children }: Props) {
  return (
    <span
      className={className}
      style={{ cursor: "pointer" }}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("ft:open-article", { detail: article })
        )
      }
    >
      {children}
    </span>
  );
}
