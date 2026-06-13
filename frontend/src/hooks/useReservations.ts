"use client";

import { useCallback, useEffect, useState } from "react";
import { reservationsApi, type ReservationFilters } from "@/lib/api";
import type { Reservation } from "@/types";

export function useReservations(initialFilters: ReservationFilters = {}) {
  const [filters, setFilters] = useState<ReservationFilters>(initialFilters);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: ReservationFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reservationsApi.list(f);
      setReservations(data);
    } catch {
      setError("Não foi possível carregar as reservas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const reload = useCallback(() => load(filters), [load, filters]);

  return {
    reservations,
    loading,
    error,
    filters,
    setFilters,
    reload,
  };
}
