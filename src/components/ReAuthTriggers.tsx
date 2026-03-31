interface ReAuthTriggersProps {
  idp: string[]
  app: string[]
}

function TriggerList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-label text-muted-foreground mb-1">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((trigger, i) => (
          <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2">
            <span>·</span>
            <span>{trigger}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReAuthTriggers({ idp, app }: ReAuthTriggersProps) {
  return (
    <div className="flex flex-col gap-4">
      <TriggerList label="IdP session policy" items={idp} />
      <TriggerList label="Application layer" items={app} />
    </div>
  )
}
