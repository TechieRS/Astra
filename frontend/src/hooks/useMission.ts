import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api, ApiError } from "../services/api";
import { usePreferences } from "../stores/preferences";
import type { Command } from "../types";

export function useMission() {
  const id = usePreferences((s) => s.sessionId);
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => api.state(id!),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}
export function useCatalog() {
  return useQuery({
    queryKey: ["mission"],
    queryFn: api.mission,
    staleTime: Infinity,
  });
}
export function useCommand() {
  const id = usePreferences((s) => s.sessionId);
  const { data: state } = useMission();
  const client = useQueryClient();
  // Keep an ambiguous network retry byte-for-byte identical, including its idempotency key.
  const pending = useRef<{
    signature: string;
    version: number;
    id: string;
  } | null>(null);
  const locked = useRef(false);
  return useMutation({
    mutationFn: async (command: Command) => {
      if (!id || !state) throw new Error("Start a mission first.");
      if (locked.current)
        throw new Error("Your previous action is still being saved.");
      locked.current = true;
      const signature = JSON.stringify(command);
      const attempt =
        pending.current?.signature === signature
          ? pending.current
          : { signature, version: state.version, id: crypto.randomUUID() };
      pending.current = attempt;
      try {
        const result = await api.action(
          id,
          command,
          attempt.version,
          attempt.id,
        );
        pending.current = null;
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status !== 0)
          pending.current = null;
        throw error;
      } finally {
        locked.current = false;
      }
    },
    onSuccess: (state) => {
      client.setQueryData(["session", id], state);
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ["session", id] });
    },
  });
}
