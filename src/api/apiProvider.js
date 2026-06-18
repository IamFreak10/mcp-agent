// Universal AI Router
// Supports OpenAI-compatible APIs: Groq, Mistral, Gemini, and others.

const DESTRUCTIVE_TOOLS = [
  // Email
  'send_personal_email',
  'create_email_draft',
  // Telegram
  'send_telegram_message',
  // Contacts
  'add_contact',
  'update_contact_name',
  'sync_telegram_contacts',
  // Calendar
  'create_calendar_event',
  'update_calendar_event',
  'delete_calendar_event',
];

const PROVIDERS = [
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    keys: [
      import.meta.env.VITE_GROQ_KEY_1,
      import.meta.env.VITE_GROQ_KEY_2,
    ].filter(Boolean),
    models: ['llama-3.3-70b-versatile', 'llama3-8b-8192'],
  },
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    keys: [
      import.meta.env.VITE_MISTRAL_KEY_1,
      import.meta.env.VITE_MISTRAL_KEY_2,
    ].filter(Boolean),
    models: ['mistral-large-latest', 'mistral-small-latest'],
  },
  {
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    keys: [import.meta.env.VITE_GEMINI_KEY_1].filter(Boolean),
    models: ['gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  {
    name: 'Cohere',
    url: 'https://api.cohere.com/v1/chat/completions',
    keys: [
      import.meta.env.VITE_COHERE_KEY_1,
      import.meta.env.VITE_COHERE_KEY_2,
      import.meta.env.VITE_COHERE_KEY_3,
    ].filter(Boolean),
    models: ['command-r-plus', 'command-r'],
  },
];

function cleanSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const cleaned = { ...schema };
  delete cleaned.$schema;
  delete cleaned.pattern; // ← এই line যোগ করুন — invalid regex Groq reject করে

  if (cleaned.properties) {
    const newProps = {};
    for (const key of Object.keys(cleaned.properties)) {
      newProps[key] = cleanSchema(cleaned.properties[key]);
    }
    cleaned.properties = newProps;
  }
  if (cleaned.items) cleaned.items = cleanSchema(cleaned.items);
  return cleaned;
}

export async function askAI(
  messagesHistory,
  tools = [],
  mcpClient = null,
  context = null
) {
  const formattedTools = tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema
        ? cleanSchema(t.inputSchema)
        : { type: 'object', properties: {} },
    },
  }));

  let formattedMessages = messagesHistory.map((m) => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content,
  }));

  if (context && context.length > 0) {
    formattedMessages.unshift({
      role: 'system',
      content: `CRITICAL CONTEXT: You have direct access to relevant user information.
Use this information to answer the user's query accurately. 
If the information is not present in the context, use tools to find it.
Context: ${context}

CRITICAL RULE — ACTION CONFIRMATION:
Before executing ANY tool that sends, deletes, or modifies data, you MUST:
1. Show the user exactly what you plan to do (recipient, content, etc.)
2. Ask "Shall I proceed? Reply confirm or cancel."
3. Only call the tool AFTER the user explicitly says "confirm" or "yes".

Tools requiring confirmation: send_personal_email, send_telegram_message, send_whatsapp_message, delete_contact, create_meeting, update_contact.
Never execute these tools in the same response where you first mention the action.`,
    });
  }

  let lastError = null;
  // Universal Router Fallback Loop
  for (const provider of PROVIDERS) {
    for (const apiKey of provider.keys) {
      for (const modelName of provider.models) {
        try {
          console.log(
            `[Router] Trying Provider: ${provider.name} | Model: ${modelName}`
          );

          let currentMessages = [...formattedMessages];
          let finalResponse = null;

          while (!finalResponse) {
            const payload = {
              model: modelName,
              messages: currentMessages,
            };

            if (formattedTools.length > 0) {
              payload.tools = formattedTools;
              payload.tool_choice = 'auto';
            }

            const response = await fetch(provider.url, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const message = data.choices[0].message;

            currentMessages.push(message);

            // while loop-এর ভেতরে, tool_calls check-এর জায়গায়:
            if (message.tool_calls && message.tool_calls.length > 0) {
              for (const toolCall of message.tool_calls) {
                const funcName = toolCall.function.name;
                const funcArgs = JSON.parse(
                  toolCall.function.arguments || '{}'
                );

                // ← HARD BLOCK — confirmation ছাড়া execute করবে না
                if (DESTRUCTIVE_TOOLS.includes(funcName)) {
                  return {
                    __type: 'NEEDS_CONFIRMATION',
                    toolName: funcName,
                    toolArgs: funcArgs,
                    preview: `📋 **Action Required:**\nTool: \`${funcName}\`\n\`\`\`json\n${JSON.stringify(funcArgs, null, 2)}\n\`\`\`\nConfirm করতে **"confirm"** লিখুন, বাতিল করতে **"cancel"**।`,
                  };
                }

                // non-destructive normally execute
                let toolResultStr;
                try {
                  const mcpResult = await mcpClient.callTool({
                    name: funcName,
                    arguments: funcArgs,
                  });
                  toolResultStr = JSON.stringify(mcpResult);
                } catch (e) {
                  toolResultStr = JSON.stringify({ error: e.message });
                }
                currentMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: toolResultStr,
                });
              }
            } else {
              finalResponse = message.content;
            }
          }
          return finalResponse;
        } catch (error) {
          console.warn(`[Router] Failed with ${provider.name}:`, error.message);
          lastError = error;
          continue;
        }
      }
    }
  }

  return `System error: ${lastError?.message || 'Providers exhausted'}`;
}
