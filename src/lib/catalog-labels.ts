export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatProgramLabel(program: { name: string; type: string }) {
  return `${program.name} (${formatEnumLabel(program.type)})`;
}
