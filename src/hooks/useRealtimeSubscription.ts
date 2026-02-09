import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "activity_feed" | "activity_reactions" | "daily_stats" | "circle_members" | "tasks";

export const useRealtimeSubscription = <T extends Record<string, unknown>>(
  table: TableName,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: { column: string; value: string }
) => {
  useEffect(() => {
    const channelName = filter ? `${table}-${filter.value}` : table;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        },
        (payload) => callback(payload as RealtimePostgresChangesPayload<T>)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, filter?.column, filter?.value]);
};
