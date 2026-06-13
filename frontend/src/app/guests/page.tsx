"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GuestTable } from "@/components/guests/GuestTable";
import { guestsApi } from "@/lib/api";
import type { Guest } from "@/types";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    guestsApi
      .list()
      .then((data) => mounted && setGuests(data))
      .catch(() => toast.error("Erro ao carregar hóspedes."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <GuestTable guests={guests} loading={loading} />
    </div>
  );
}
