// contextBuilder.js — Strong Context that Prevents Redundant Tool Calls
import { buildMemorySummary } from '../ai/memoryManager';

export function buildContext(relevantMemory) {
  const hasContacts = relevantMemory.contacts?.length > 0;
  const hasMeetings = relevantMemory.meetings?.length > 0;
  const hasTasks = relevantMemory.tasks?.length > 0;

  if (!hasContacts && !hasMeetings && !hasTasks) {
    return `
[SYSTEM MEMORY STATUS]
Cache summary: ${buildMemorySummary()}
No directly relevant records found for this query.
You MAY use tools if the user asks for real-time or external data.
    `.trim();
  }

  const sections = [];

  if (hasContacts) {
    const flatContacts = relevantMemory.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email ?? null,
      note: c.note ?? null,
      telegramId: c.telegram?.telegramId ?? null, // ← flat
      telegramUsername: c.telegram?.username ?? null, // ← flat
      whatsapp: c.whatsapp ?? null,
      blood: c.blood ?? null,
    }));

    sections.push(`
## CONTACTS (${flatContacts.length} records — USE THIS, DO NOT call contact tools):
${JSON.stringify(flatContacts, null, 2)}`);
  }
  if (hasMeetings) {
    sections.push(`
## MEETINGS (${relevantMemory.meetings.length} records — USE THIS, DO NOT call meeting tools):
${JSON.stringify(relevantMemory.meetings, null, 2)}`);
  }

  if (hasTasks) {
    sections.push(`
## TASKS (${relevantMemory.tasks.length} records — USE THIS, DO NOT call task tools):
${JSON.stringify(relevantMemory.tasks, null, 2)}`);
  }

  return `
[SYSTEM CACHE — LOADED & VERIFIED — ${new Date().toLocaleTimeString()}]
INSTRUCTION: The following data is ALREADY fetched and cached. 
Answer using ONLY this data. DO NOT make tool calls for contacts, meetings, or tasks.
Only use tools for: sending messages, creating NEW records, or external web data.

${sections.join('\n')}
  `.trim();
}
