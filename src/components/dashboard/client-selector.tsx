"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { Client } from "@/types";

interface ClientSelectorProps {
  clients: Client[];
}

export default function ClientSelector({ clients }: ClientSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedId = searchParams.get("clientId") ?? "";
  const selectedClient = clients.find((c) => c.id === selectedId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(clientId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (clientId) {
      params.set("clientId", clientId);
    } else {
      params.delete("clientId");
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="max-w-[160px] truncate">
          {selectedClient ? selectedClient.name : "All Clients"}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
          <button
            onClick={() => select("")}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              !selectedId
                ? "bg-red-50 text-red-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Clients
          </button>
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => select(client.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedId === client.id
                  ? "bg-red-50 text-red-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="truncate block">{client.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
