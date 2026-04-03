"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ACTIVITY_QUERY_KEY, ACTIVITY_TYPE_KEY } from "@/lib/preferences";

type ActivityFilterSyncProps = {
  typeFilter: string;
  queryFilter: string;
};

export function ActivityFilterSync({ typeFilter, queryFilter }: ActivityFilterSyncProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyToPersist, setReadyToPersist] = useState(false);

  useEffect(() => {
    if (typeFilter || queryFilter) {
      setReadyToPersist(true);
      return;
    }

    try {
      const savedType = window.localStorage.getItem(ACTIVITY_TYPE_KEY) ?? "";
      const savedQuery = window.localStorage.getItem(ACTIVITY_QUERY_KEY) ?? "";

      if (savedType || savedQuery) {
        const params = new URLSearchParams();
        if (savedType) {
          params.set("type", savedType);
        }
        if (savedQuery) {
          params.set("q", savedQuery);
        }
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }
    } catch {
      // Ignore storage exceptions so page remains usable.
    }

    setReadyToPersist(true);
  }, [pathname, queryFilter, router, typeFilter]);

  useEffect(() => {
    if (!readyToPersist) {
      return;
    }

    try {
      window.localStorage.setItem(ACTIVITY_TYPE_KEY, typeFilter);
      window.localStorage.setItem(ACTIVITY_QUERY_KEY, queryFilter);
    } catch {
      // Ignore storage exceptions so page remains usable.
    }
  }, [queryFilter, readyToPersist, typeFilter]);

  return null;
}
