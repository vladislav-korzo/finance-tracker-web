import { motion } from 'framer-motion';
import { useId } from 'react';

type SparklineProps = {
  data: number[];
  /** CSS color for the line/area. Defaults to the primary token. */
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  /** Draw the filled area under the line. */
  area?: boolean;
};

function buildPath(data: number[], w: number, h: number, pad: number): { line: string; area: string } {
  if (data.length === 0) return { line: '', area: '' };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });

  // Smooth the line with a light Catmull-Rom → cubic bezier conversion.
  let line = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  const area = `${line} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;
  return { line, area };
}

/** Tiny animated trend chart for cards. Pure SVG, no chart library. */
export function Sparkline({
  data,
  color = 'hsl(var(--primary))',
  width = 120,
  height = 36,
  strokeWidth = 2,
  className,
  area = true,
}: SparklineProps) {
  const gradId = useId();
  const { line, area: areaPath } = buildPath(data, width, height, strokeWidth);
  if (!line) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area ? (
        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      ) : null}
      <motion.path
        d={line}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
