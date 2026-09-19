export function extractJsonFromString(text: string): any {
  if (typeof text !== 'string') return text;

  // 1. Markdown code block ```json ... ```
  const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (blockMatch) {
    try { return JSON.parse(blockMatch[1].trim()); } catch {}
  }

  // 2. Array [...] hoặc Object {...}
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }
  const objectMatch = text.match(/\{[\s\S]*?\}/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[0]); } catch {}
  }

  throw new Error('Không tìm thấy JSON hợp lệ trong phản hồi từ AI');
}
