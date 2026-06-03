import { APP_MEMORY } from '../cache/globalCache';

export function findRelevantMemory(query) {
  const memory = APP_MEMORY.getAll();
  const lowerQuery = query.toLowerCase();

  // Generic queries → return everything
  const genericKeywords = [
    'contact',
    'all',
    'list',
    'show',
    'find',
    'কন্টাক',
    'সব',
  ];
  const isGeneric = genericKeywords.some((k) => lowerQuery.includes(k));

  return {
    contacts: isGeneric
      ? memory.contacts // return ALL contacts
      : memory.contacts.filter((c) => {
          const contactString = JSON.stringify({
            name: c.name,
            phone: c.phone,
            note: c.note,
            email: c.email,
            telegramId: c.telegram?.telegramId,
          }).toLowerCase();
          return contactString.includes(lowerQuery);
        }),
    meetings: memory.meetings.filter((m) =>
      JSON.stringify(m).toLowerCase().includes(lowerQuery)
    ),
    tasks: memory.tasks.filter((t) =>
      JSON.stringify(t).toLowerCase().includes(lowerQuery)
    ),
    notes: memory.notes || [],
  };
}
