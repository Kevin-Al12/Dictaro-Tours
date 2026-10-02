'use client';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
}

export default function DonutChart({ data, size = 120, thickness = 16 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        {total === 0 ? (
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
        ) : (
          data.filter((d) => d.value > 0).map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const offset = cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })
        )}
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {total === 0 ? (
          <p className="text-sm text-gray-400">Sin datos todavía</p>
        ) : (
          data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-gray-600 truncate">{d.label}</span>
              <span className="text-gray-900 font-semibold ml-auto">{d.value}</span>
              <span className="text-gray-400 text-xs w-9 text-right">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
