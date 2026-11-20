export function toMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid time format '${hhmm}'. Expected HH:MM`);
  }
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 24 || m < 0 || m > 59) {
    throw new Error(`Invalid time values in '${hhmm}'`);
  }
  return h * 60 + m;
}

export function toHHMM(totalMins: number): string {
  if (totalMins < 0) totalMins = 0;
  const h = Math.floor(totalMins / 60) % 24;
  const m = Math.floor(totalMins % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
