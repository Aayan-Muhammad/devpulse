"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  REPOS_LANGUAGE_KEY,
  REPOS_QUERY_KEY,
  REPOS_SORT_KEY,
} from "@/lib/preferences";

type ReposFilterSyncProps = {
  queryFilter: string;
  languageFilter: string;
  sortBy: string;
};

const VALID_SORTS = new Set(["updated", "stars", "forks", "name"]);

export function ReposFilterSync({
  queryFilter,
  languageFilter,
  sortBy,
}: ReposFilterSyncProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyToPersist, setReadyToPersist] = useState(false);

  useEffect(() => {
    if (queryFilter || languageFilter || sortBy !== "updated") {
      setReadyToPersist(true);
      return;
    }

    try {
      const savedQuery = window.localStorage.getItem(REPOS_QUERY_KEY) ?? "";
      const savedLanguage = window.localStorage.getItem(REPOS_LANGUAGE_KEY) ?? "";
      const savedSort = window.localStorage.getItem(REPOS_SORT_KEY) ?? "updated";

      if (savedQuery || savedLanguage || savedSort !== "updated") {
        const params = new URLSearchParams();
        if (savedQuery) params.set("q", savedQuery);
        if (savedLanguage) params.set("language", savedLanguage);
        if (VALID_SORTS.has(savedSort)) params.set("sort", savedSort);
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }
    } catch {
      // Ignore storage exceptions so page remains usable.
    }

    setReadyToPersist(true);
  }, [languageFilter, pathname, queryFilter, router, sortBy]);

  useEffect(() => {
    if (!readyToPersist) return;

    try {
      window.localStorage.setItem(REPOS_QUERY_KEY, queryFilter);
      window.localStorage.setItem(REPOS_LANGUAGE_KEY, languageFilter);
      window.localStorage.setItem(REPOS_SORT_KEY, sortBy);
    } catch {
      // Ignore storage exceptions so page remains usable.
    }
  }, [languageFilter, queryFilter, readyToPersist, sortBy]);

  return null;
}
