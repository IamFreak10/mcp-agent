// Universal AI Router
// Supports OpenAI-compatible APIs: Groq, Mistral, Gemini, and others.

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
  if (!schema || typeof schema !== 'object') {
    return schema;
  }
  const cleaned = { ...schema };
  delete cleaned.$schema;

  if (cleaned.properties && typeof cleaned.properties === 'object') {
    const newProps = {};
    for (const key of Object.keys(cleaned.properties)) {
      newProps[key] = cleanSchema(cleaned.properties[key]);
    }
    cleaned.properties = newProps;
  }
  if (cleaned.items && typeof cleaned.items === 'object') {
    cleaned.items = cleanSchema(cleaned.items);
  }
  return cleaned;
}

export async function askGemini(
  messagesHistory,
  tools = [],
  mcpClient = null,
  cachedContacts = null
) {
  // ১. ওয়ান-টাইম ফরম্যাট করে নেওয়া
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

  // ২. মেসেজ ফরম্যাট করার সময় যদি cachedContacts থাকে, সেটা একদম প্রথমে ইনজেক্ট করা
  let formattedMessages = messagesHistory.map((m) => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content,
  }));

  // ⚡ এইখানে আসল ট্রিক: ক্যাশ ডেটা থাকলে তা সিস্টেম প্রম্পট হিসেবে শুরুতে ঢুকিয়ে দেওয়া
  if (cachedContacts && cachedContacts.length > 0) {
    formattedMessages.unshift({
      role: 'system',
      content: `CRITICAL CONTEXT: You have direct access to the user's client-side cached contacts. 
      DO NOT use any search/find tool if the information is available below.
      Cached Contacts: ${JSON.stringify(cachedContacts)}`,
    });
  }

  let lastError = null;
  // Universal Router Fallback Loop
  for (const provider of PROVIDERS) {
    for (const apiKey of provider.keys) {
      for (const modelName of provider.models) {
        try {
          console.log(
            `[Router] Trying Provider: ${provider.name} | Model: ${modelName} | Key: ...${apiKey.slice(-4)}`
          );

          let currentMessages = [...formattedMessages];
          let finalResponse = null;

          // Tool Execution Loop
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
            console.log(response);
            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const choice = data.choices[0];
            const message = choice.message;

            currentMessages.push(message); // Append AI's message to history

            if (message.tool_calls && message.tool_calls.length > 0) {
              for (const toolCall of message.tool_calls) {
                const funcName = toolCall.function.name;
                const funcArgs = toolCall.function.arguments
                  ? JSON.parse(toolCall.function.arguments)
                  : {};

                console.log(
                  `[${provider.name}] Requested tool: ${funcName}`,
                  funcArgs
                );

                let toolResultStr;
                if (mcpClient) {
                  try {
                    console.log(`[MCP] Executing: ${funcName}...`);
                    const mcpResult = await mcpClient.callTool({
                      name: funcName,
                      arguments: funcArgs,
                    });
                    console.log(`[MCP] Success!`);
                    toolResultStr = JSON.stringify(mcpResult);
                  } catch (e) {
                    console.error(`[MCP] Failed:`, e);
                    toolResultStr = JSON.stringify({ error: e.message });
                  }
                } else {
                  toolResultStr = JSON.stringify({
                    error: 'No MCP client provided.',
                  });
                }

                currentMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: toolResultStr,
                });
              }
            } else {
              // No tool calls, we have the final text answer
              finalResponse = message.content;
            }
          }

          console.log(
            `[Router] Successfully generated response using ${provider.name} (${modelName})`
          );
          return finalResponse;
        } catch (error) {
          console.warn(
            `[Router] Failed with ${provider.name} (${modelName}):`,
            error.message
          );
          lastError = error;
          // Continue to next model/key/provider
          continue;
        }
      }
    }
  }

  console.error('[Router] All providers exhausted. Last error:', lastError);
  return `দুঃখিত, বর্তমানে সবগুলো এপিআই প্রোভাইডারের কোটা শেষ বা সার্ভার ডাউন। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন। (Error: ${lastError?.message})`;
}
