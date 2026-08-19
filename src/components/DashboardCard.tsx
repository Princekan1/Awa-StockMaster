import type { ReactNode } from 'react';

type Tone = 'default' | 'green' | 'amber' | 'purple' | 'blue';

interface DashboardCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  default: '',
  green: 'stat-card-green',
  amber: 'stat-card-amber',
  purple: 'stat-card-purple',
  blue: 'stat-card-blue',
};

export default function DashboardCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
}: DashboardCardProps) {
  return (
    <div className={`stat-card ${toneClass[tone]}`}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {sub && <span className="stat-card-sub">{sub}</span>}
      {icon && <div className="stat-card-icon">{icon}</div>}
    </div>
  );
}
