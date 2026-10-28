/**
 * Serialises a JSON-LD object for safe inline use in dangerouslySetInnerHTML.
 * JSON.stringify alone is unsafe because a value containing </script> terminates
 * the enclosing script tag; replacing < > & with their Unicode escapes prevents this.
 */
export function safeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
