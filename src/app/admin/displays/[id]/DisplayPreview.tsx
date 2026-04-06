"use client";

import { useState } from "react";

export function DisplayPreview({ displayId }: { displayId: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl rounded-lg overflow-hidden border border-zinc-300 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-800 text-white px-3 py-2">
        <span className="text-xs font-medium">Náhled displeje</span>
        <div className="flex items-center gap-2">
          <a
            href={`/display/${displayId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white"
            title="Otevřít v novém okně"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-white"
            title={collapsed ? "Rozbalit" : "Sbalit"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* iframe */}
      {!collapsed && (
        <div className="aspect-video bg-black relative">
          <iframe
            src={`/display/${displayId}`}
            className="w-full h-full border-0"
            style={{ pointerEvents: "none" }}
            title="Display preview"
          />
        </div>
      )}
    </div>
  );
}
