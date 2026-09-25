export type ExportableListItem = {
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

export function buildCsvContent(items: ExportableListItem[], listName: string): string {
  const rows: string[] = [
    `# ${listName}`,
    'Name,Category,Status,Visited On,Notes',
  ];

  for (const item of items) {
    const status = item.completed ? 'Done' : 'To Do';
    const visitedAt = item.visitedAt
      ? new Date(item.visitedAt).toLocaleDateString('en-GB')
      : '';
    rows.push(
      [
        escapeCsvField(item.name),
        escapeCsvField(item.category ?? ''),
        status,
        visitedAt,
        escapeCsvField(item.notes ?? ''),
      ].join(','),
    );
  }

  return rows.join('\n');
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

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_]/gi, '-').replace(/-+/g, '-').toLowerCase();
}
