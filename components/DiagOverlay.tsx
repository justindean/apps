"use client";

import { useSyncExternalStore, useState } from "react";
import {
  isDiagEnabled,
  subscribeDiag,
  getDiagVersion,
  getDiagEvents,
  clearDiag,
  type DiagChannel,
} from "@/lib/diag";

/**
 * Temporary diagnostic overlay (PR-2, observability only).
 * Renders nothing unless diagnostics are enabled (see lib/diag.ts).
 * Collapsible; sits above every app surface (sheets z-50, demo z-100).
 */

const channelStyle: Record<DiagChannel, string> = {
  HEAR: "bg-sky-500/20 text-sky-200",
  SAY: "bg-emerald-500/20 text-emerald-200",
  DEMO: "bg-amber-500/20 text-amber-200",
  DRAWER: "bg-fuchsia-500/20 text-fuchsia-200",
  SYS: "bg-stone-500/25 text-stone-200",
};

export function DiagOverlay() {
  const enabled = isDiagEnabled();
  const [open, setOpen] = useState(false);

  // Subscribe to the diag store; snapshot is a monotonic version number.
  useSyncExternalStore(subscribeDiag, getDiagVersion, () => 0);

  if (!enabled) return null;

  const events = getDiagEvents();

  const copyAll = () => {
    const text = events
      .map((e, i) => {
        const prev = i > 0 ? events[i - 1].t : e.t;
        const delta = e.t - prev;
        return `T+${e.t}ms (+${delta}ms) [${e.channel}] ${e.label}${e.detail ? ` — ${e.detail}` : ""}`;
      })
      .join("\n");
    try {
      void navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-[9999] flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1.5 font-mono text-[11px] font-bold text-white shadow-lg backdrop-blur"
        aria-label="Open diagnostics"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        diag {events.length}
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 left-3 z-[9999] flex max-h-[70dvh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-xl border border-white/10 bg-black/90 font-mono text-white shadow-2xl backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-bold tracking-wide">TapHabla diag</span>
          <span className="text-[10px] text-white/40">{events.length} events</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyAll}
            className="rounded px-2 py-0.5 text-[10px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            copy
          </button>
          <button
            onClick={() => clearDiag()}
            className="rounded px-2 py-0.5 text-[10px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            clear
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-2 py-0.5 text-[10px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Collapse diagnostics"
          >
            ×
          </button>
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {events.length === 0 ? (
          <p className="px-1 py-2 text-[11px] text-white/40">No events yet. Interact with the app.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {events.map((e, i) => {
              const prev = i > 0 ? events[i - 1].t : e.t;
              const delta = e.t - prev;
              return (
                <li key={e.id} className="flex items-start gap-1.5 rounded px-1 py-0.5 text-[11px] leading-tight hover:bg-white/[0.04]">
                  <span className="w-[52px] shrink-0 text-right tabular-nums text-white/45">T+{e.t}</span>
                  <span className="w-[42px] shrink-0 text-right tabular-nums text-white/30">+{delta}</span>
                  <span className={`shrink-0 rounded px-1 text-[9px] font-bold ${channelStyle[e.channel]}`}>{e.channel}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-white/90">{e.label}</span>
                    {e.detail ? <span className="text-white/50"> — {e.detail}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-3 py-1 text-[9px] text-white/30">
        {"T+ = ms since first event · +Δ = ms since previous · temporary (PR-2)"}
      </div>
    </div>
  );
}
