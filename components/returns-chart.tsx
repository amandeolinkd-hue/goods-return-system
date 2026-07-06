"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/utils";

export type ChartPoint = { label: string; n: number; value: number };

const W = 760;
const H = 280;
const PAD = { l: 34, r: 16, t: 22, b: 30 };

function niceScale(max: number) {
  if (max <= 0) return { niceMax: 4, step: 1 };
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * pow);
  const step = candidates.find((c) => max / c <= 5) ?? candidates[candidates.length - 1];
  return { niceMax: Math.ceil(max / step) * step, step };
}

function smoothPath(p: { x: number; y: number }[]) {
  if (p.length < 2) return p.length ? `M ${p[0].x} ${p[0].y}` : "";
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function ReturnsChart({ data }: { data: ChartPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const geom = useMemo(() => {
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;
    const baseY = PAD.t + plotH;
    const { niceMax, step } = niceScale(Math.max(...data.map((d) => d.n), 0));
    const x = (i: number) => (data.length <= 1 ? PAD.l + plotW / 2 : PAD.l + i * (plotW / (data.length - 1)));
    const y = (v: number) => baseY - (v / niceMax) * plotH;
    const pts = data.map((d, i) => ({ x: x(i), y: y(d.n), ...d }));
    const line = smoothPath(pts);
    const area = pts.length
      ? `${line} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`
      : "";
    const gridVals: number[] = [];
    for (let g = 0; g * step <= niceMax + 0.001; g++) gridVals.push(g * step);
    const peak = data.reduce((m, d, i) => (d.n > data[m].n ? i : m), 0);
    const stepW = data.length > 1 ? (pts[1].x - pts[0].x) : plotW;
    return { plotH, baseY, niceMax, x, y, pts, line, area, gridVals, peak, stepW };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  const { baseY, y, pts, line, area, gridVals, peak, stepW } = geom;
  const shown = active ?? peak;
  const ap = pts[shown];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Returns by month"
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id="rc-ln" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="rc-fl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4f46e5" stopOpacity="0.28" />
            <stop offset="0.7" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="1" stopColor="#6d28d9" stopOpacity="0" />
          </linearGradient>
          <filter id="rc-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid + y labels */}
        {gridVals.map((v, i) => {
          const gy = y(v);
          return (
            <g key={v}>
              <line
                x1={PAD.l}
                y1={gy}
                x2={W - PAD.r}
                y2={gy}
                stroke={i === 0 ? "#e2e4ee" : "#eef0f5"}
                strokeWidth={1}
              />
              <text x={PAD.l - 8} y={gy + 3} textAnchor="end" fill="#a2a6b4" fontSize={11}>
                {v}
              </text>
            </g>
          );
        })}

        {/* area + line */}
        <path className="rc-area" d={area} fill="url(#rc-fl)" />
        {active !== null && (
          <line x1={ap.x} y1={PAD.t} x2={ap.x} y2={baseY} stroke="#c7c9d6" strokeWidth={1} strokeDasharray="3 3" />
        )}
        <path
          className="rc-line"
          d={line}
          fill="none"
          stroke="url(#rc-ln)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          filter="url(#rc-glow)"
        />

        {/* dots */}
        {pts.map((p, i) => {
          const on = i === shown;
          return (
            <g key={i}>
              {on && <circle cx={p.x} cy={p.y} r={11} fill="#4f46e5" opacity={0.16} />}
              <circle
                className="rc-dot"
                cx={p.x}
                cy={p.y}
                r={on ? 5 : 3.5}
                fill="#4f46e5"
                stroke="#fff"
                strokeWidth={on ? 2.5 : 2}
                style={{ animationDelay: `${0.6 + i * 0.05}s` }}
              />
            </g>
          );
        })}

        {/* idle peak value label */}
        {active === null && (
          <text
            x={pts[peak].x}
            y={pts[peak].y - 14}
            textAnchor="middle"
            fill="#4f46e5"
            fontSize={11}
            fontWeight={700}
          >
            {pts[peak].n}
          </text>
        )}

        {/* x labels */}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 10} textAnchor="middle" fill="#8b8f9d" fontSize={11}>
            {p.label}
          </text>
        ))}

        {/* hover hit targets */}
        {pts.map((p, i) => (
          <rect
            key={i}
            x={p.x - stepW / 2}
            y={0}
            width={stepW}
            height={H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
          />
        ))}
      </svg>

      {/* tooltip (hover only) */}
      {active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#14151d] px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(ap.x / W) * 100}%`, top: `${(ap.y / H) * 100 - 3}%` }}
        >
          <div className="font-semibold">{ap.label}</div>
          <div className="text-indigo-200">
            {ap.n} return{ap.n === 1 ? "" : "s"}
          </div>
          <div className="text-emerald-200">{formatINR(ap.value)}</div>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#14151d]" />
        </div>
      )}
    </div>
  );
}
