export type ExportListItem = {
  name: string;
  category: string | null;
  completed: boolean;
  visitedAt: string | null;
  notes: string | null;
};

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvRows(items: ExportListItem[]): string {
  const header = 'Name,Category,Completed,Visited At,Notes';
  const rows = items.map((item) => {
    const name = escapeCsvField(item.name);
    const category = escapeCsvField(item.category ?? '');
    const completed = item.completed ? 'Yes' : 'No';
    const visitedAt = item.visitedAt
      ? escapeCsvField(new Date(item.visitedAt).toLocaleDateString('en-GB'))
      : '';
    const notes = escapeCsvField(item.notes ?? '');
    return [name, category, completed, visitedAt, notes].join(',');
  });
  return [header, ...rows].join('\n');
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'list';
}
