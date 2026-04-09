import { useEffect, useMemo, useRef, useState } from 'react';
import type { TrackChartProps } from '@/lib/types/flight';
import './TrackChart.scss';

const CHICAGO_TZ = 'America/Chicago';
const CHART_COLORS = {
  panelFill: 'rgba(108, 112, 121, 0.22)',
  panelStroke: 'rgba(255,255,255,0.16)',
  axis: 'rgba(255,255,255,0.16)',
  tick: 'rgba(255,255,255,0.82)',
  bottomTick: 'rgba(255,255,255,0.68)',
  altitude: 'rgba(24,28,34,0.94)',
  speed: 'rgba(247,248,250,0.96)',
  cursor: 'rgba(67,153,255,0.82)',
  hover: 'rgba(255,255,255,0.18)',
} as const;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { timeZone: CHICAGO_TZ });
}

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function fmtInt(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

function downsampleKeepEnds<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  if (max < 2) return [arr[0]];
  const out: T[] = [];
  const step = (arr.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) {
    const idx = Math.round(i * step);
    out.push(arr[idx]);
  }
  out[0] = arr[0];
  out[out.length - 1] = arr[arr.length - 1];
  return out;
}

export default function TrackChart({
  samples,
  cursorIdx,
  onCursorChange,
  height = 210,
  maxRenderPoints = 2200,
}: TrackChartProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(800);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setW(Math.floor(r.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = samples.length;
  const safeCursor = Math.max(0, Math.min(n - 1, cursorIdx));
  const active = samples[safeCursor];
  const hovered =
    hoverIdx != null ? samples[Math.max(0, Math.min(n - 1, hoverIdx))] : null;

  const renderIdxs = useMemo(
    () =>
      downsampleKeepEnds(
        Array.from({ length: n }, (_, i) => i),
        maxRenderPoints,
      ),
    [n, maxRenderPoints],
  );

  const altVals = useMemo(
    () =>
      renderIdxs
        .map((i) => samples[i]?.altAglFt)
        .filter(
          (x): x is number => typeof x === 'number' && Number.isFinite(x),
        ),
    [renderIdxs, samples],
  );
  const gsVals = useMemo(
    () =>
      renderIdxs
        .map((i) => samples[i]?.gsKt)
        .filter(
          (x): x is number => typeof x === 'number' && Number.isFinite(x),
        ),
    [renderIdxs, samples],
  );

  const altMin = altVals.length ? Math.min(...altVals) : 0;
  const altMax = altVals.length ? Math.max(...altVals) : 1;
  const gsMin = gsVals.length ? Math.min(...gsVals) : 0;
  const gsMax = gsVals.length ? Math.max(...gsVals) : 1;

  const padL = 56;
  const padR = 56;
  const padT = 18;
  const padB = 28;
  const H = height;
  const W = Math.max(320, w);
  const innerW = Math.max(1, W - padL - padR);
  const innerH = Math.max(1, H - padT - padB);

  const xForIndex = (idx: number) => padL + (idx / Math.max(1, n - 1)) * innerW;
  const idxForX = (x: number) => {
    const t = (x - padL) / innerW;
    return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
  };

  const yAlt = (alt: number) => {
    const denom = altMax - altMin || 1;
    return padT + (1 - (alt - altMin) / denom) * innerH;
  };
  const yGs = (gs: number) => {
    const denom = gsMax - gsMin || 1;
    return padT + (1 - (gs - gsMin) / denom) * innerH;
  };

  const altPath = useMemo(() => {
    let d = '';
    for (const idx of renderIdxs) {
      const s = samples[idx];
      if (!s) continue;
      if (typeof s.altAglFt !== 'number' || !Number.isFinite(s.altAglFt))
        continue;
      const x = xForIndex(idx);
      const y = yAlt(s.altAglFt);
      d += d
        ? ` L ${x.toFixed(2)} ${y.toFixed(2)}`
        : `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d;
  }, [renderIdxs, samples, innerW, innerH, altMin, altMax]);

  const gsPath = useMemo(() => {
    let d = '';
    for (const idx of renderIdxs) {
      const s = samples[idx];
      if (!s) continue;
      if (typeof s.gsKt !== 'number' || !Number.isFinite(s.gsKt)) continue;
      const x = xForIndex(idx);
      const y = yGs(s.gsKt);
      d += d
        ? ` L ${x.toFixed(2)} ${y.toFixed(2)}`
        : `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d;
  }, [renderIdxs, samples, innerW, innerH, gsMin, gsMax]);

  const cursorX = xForIndex(safeCursor);
  const hoverX = hoverIdx != null ? xForIndex(hoverIdx) : null;
  const displaySample = hovered ?? active;
  const labelY = 14;
  const leftLabelX = Math.max(padL + 2, cursorX - 8);
  const leftLabelAnchor = cursorX - 8 < padL + 2 ? 'start' : 'end';
  const rightLabelX = Math.min(W - padR - 2, cursorX + 8);
  const rightLabelAnchor = cursorX + 8 > W - padR - 2 ? 'end' : 'start';

  return (
    <div
      ref={wrapRef}
      className="track-chart"
      style={{ height: H }}
      onPointerDown={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - r.left;
        const idx = idxForX(x);
        onCursorChange(idx);
        setDragging(true);
        (e.currentTarget as any).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - r.left;
        const idx = idxForX(x);
        setHoverIdx(idx);
        if (dragging) onCursorChange(idx);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => {
        setDragging(false);
        setHoverIdx(null);
      }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Altitude and speed chart">
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          rx={14}
          fill={CHART_COLORS.panelFill}
          stroke={CHART_COLORS.panelStroke}
        />

        {/* axes */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={H - padB}
          stroke={CHART_COLORS.axis}
        />
        <line
          x1={W - padR}
          y1={padT}
          x2={W - padR}
          y2={H - padB}
          stroke={CHART_COLORS.axis}
        />
        <line
          x1={padL}
          y1={H - padB}
          x2={W - padR}
          y2={H - padB}
          stroke={CHART_COLORS.axis}
        />

        {/* ticks */}
        <text
          x={padL - 8}
          y={padT + 10}
          fill={CHART_COLORS.tick}
          fontSize="11"
          textAnchor="end">
          {fmtNum(altMax, 0)}
        </text>
        <text
          x={padL - 8}
          y={H - padB}
          fill={CHART_COLORS.tick}
          fontSize="11"
          textAnchor="end">
          {fmtNum(altMin, 0)}
        </text>
        <text
          x={W - padR + 8}
          y={padT + 10}
          fill={CHART_COLORS.tick}
          fontSize="11">
          {fmtNum(gsMax, 0)}
        </text>
        <text
          x={W - padR + 8}
          y={H - padB}
          fill={CHART_COLORS.tick}
          fontSize="11">
          {fmtNum(gsMin, 0)}
        </text>

        {/* series */}
        <path
          d={altPath}
          fill="none"
          stroke={CHART_COLORS.altitude}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.1"
        />
        <path
          d={gsPath}
          fill="none"
          stroke={CHART_COLORS.speed}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.1"
        />

        {/* cursor */}
        <line
          x1={cursorX}
          y1={padT}
          x2={cursorX}
          y2={H - padB}
          stroke={CHART_COLORS.cursor}
          strokeWidth="1.5"
        />

        {/* hover */}
        {hoverX != null && (
          <line
            x1={hoverX}
            y1={padT}
            x2={hoverX}
            y2={H - padB}
            stroke={CHART_COLORS.hover}
            strokeWidth="1"
          />
        )}

        {/* cursor readout (no box, no time) */}
        <text
          x={leftLabelX}
          y={labelY}
          fill={CHART_COLORS.altitude}
          fontSize="12"
          fontWeight="800"
          textAnchor={leftLabelAnchor as any}>
          {fmtInt(displaySample.altAglFt)} ft
        </text>
        <text
          x={rightLabelX}
          y={labelY}
          fill={CHART_COLORS.speed}
          fontSize="12"
          fontWeight="800"
          textAnchor={rightLabelAnchor as any}>
          {fmtInt(displaySample.gsKt)} kts
        </text>

        {/* bottom labels */}
        <text x={padL} y={H - 8} fill={CHART_COLORS.bottomTick} fontSize="11">
          {fmtTime(samples[0].t)}
        </text>
        <text
          x={W - padR}
          y={H - 8}
          fill={CHART_COLORS.bottomTick}
          fontSize="11"
          textAnchor="end">
          {fmtTime(samples[n - 1].t)}
        </text>
      </svg>
    </div>
  );
}
