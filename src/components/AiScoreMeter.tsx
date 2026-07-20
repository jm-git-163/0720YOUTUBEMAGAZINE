interface AiScoreMeterProps {
  label: string
  value: number
  accent?: 'gold' | 'crimson'
}

export function AiScoreMeter({
  label,
  value,
  accent = 'gold',
}: AiScoreMeterProps) {
  const bar =
    accent === 'crimson'
      ? 'bg-gradient-to-r from-primary to-accent-crimson'
      : 'bg-gradient-to-r from-primary to-accent-gold'

  return (
    <div>
      <div className="mb-1 flex justify-between font-body text-label-sm">
        <span>{label}</span>
        <span className="font-mono font-bold text-primary">{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
