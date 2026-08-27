export type ExportItem = {
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

export function buildCsvContent(items: ExportItem[]): string {
  const header = ['Name', 'Category', 'Status', 'Visited Date', 'Notes'];
  const rows = items.map((item) => [
    escapeCsvField(item.name),
    escapeCsvField(item.category ?? ''),
    item.completed ? 'Done' : 'To Do',
    item.visitedAt
      ? new Date(item.visitedAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '',
    escapeCsvField(item.notes ?? ''),
  ]);
  return [header, ...rows].map((row) => row.join(',')).join('\n');
}

export function buildCsvFilename(listName: string): string {
  return `${listName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}.csv`;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
