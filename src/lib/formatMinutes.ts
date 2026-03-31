export function formatMinutes(n: number): string {
  if (n < 60) return `${n} min`
  if (n < 1440) {
    const h = n / 60
    return h === 1 ? '1 hour' : `${h} hours`
  }
  const d = n / 1440
  return d === 1 ? '1 day' : `${d} days`
}
