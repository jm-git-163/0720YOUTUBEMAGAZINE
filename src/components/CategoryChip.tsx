interface CategoryChipProps {
  label: string
  active?: boolean
  onClick?: () => void
}

export function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 font-body text-label-md transition-all ${
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border-subtle bg-surface-pure text-text-muted hover:border-primary'
      }`}
    >
      {label}
    </button>
  )
}
