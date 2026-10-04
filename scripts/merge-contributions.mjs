const DAY = 86400000;
export function mergeContributions(sources, endDate) {
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(end)) throw new Error('Invalid end date');
  const start = end - 364 * DAY;
  const origin = start - new Date(start).getUTCDay() * DAY;
  const totals = new Map();
  for (const source of sources) {
    if (!Array.isArray(source) || source.length === 0) throw new Error('Empty contribution source');
    const seen = new Set();
    for (const { date, count } of source) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || !Number.isInteger(count) || count < 0 || seen.has(date)) {
        throw new Error('Invalid or duplicate contribution day');
      }
      seen.add(date);
      const time = Date.parse(date);
      if (time >= start && time <= end) totals.set(date, (totals.get(date) ?? 0) + count);
    }
  }
  const max = Math.max(1, ...totals.values());
  return Array.from({ length: 365 }, (_, i) => {
    const time = start + i * DAY;
    const date = new Date(time).toISOString().slice(0, 10);
    const count = totals.get(date) ?? 0;
    return { date, count, x: Math.floor((time - origin) / (7 * DAY)), y: new Date(time).getUTCDay(), level: count ? Math.ceil(count * 4 / max) : 0 };
  });
}
