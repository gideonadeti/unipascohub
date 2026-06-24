export function formatCount(count: number): string {
  if (count >= 1_000_000_000) {
    const n = count / 1_000_000_000;
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}B`;
  }

  if (count >= 1_000_000) {
    const n = count / 1_000_000;
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`;
  }

  if (count >= 10_000) {
    const n = count / 1_000;
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}k`;
  }

  return count.toLocaleString();
}

export function formatCountLong(count: number): string {
  return count.toLocaleString();
}
