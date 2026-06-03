// src/ai/contextBuilder.js

export function buildContext(relevantMemory) {
  return `
    Current Date: ${new Date().toDateString()}
    
    Relevant Context:
    - Contacts: ${JSON.stringify(relevantMemory.contacts || [])}
    - Meetings: ${JSON.stringify(relevantMemory.meetings || [])}
    - Tasks: ${JSON.stringify(relevantMemory.tasks || [])}
    - Notes: ${JSON.stringify(relevantMemory.notes || [])}
  `;
}
