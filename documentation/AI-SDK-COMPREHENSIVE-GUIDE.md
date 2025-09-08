# Vercel AI SDK 3.0 - Comprehensive Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [React Hooks](#react-hooks)
4. [Streaming Features](#streaming-features)
5. [Tool Calling](#tool-calling)
6. [Persistence & Sessions](#persistence--sessions)
7. [UI Components](#ui-components)
8. [Real-World Use Cases](#real-world-use-cases)
9. [Best Practices](#best-practices)

---

## Overview

The Vercel AI SDK is a TypeScript-first library for building AI-powered applications with streaming, tool calling, and persistence. It provides a unified interface across multiple AI providers (OpenAI, Anthropic, Google, etc.) with built-in React hooks for seamless integration.

### Key Features
- **Provider Agnostic**: Switch between AI providers without code changes
- **Streaming First**: Built for real-time streaming responses
- **Type Safe**: Full TypeScript support with inference
- **React Integration**: Purpose-built hooks for React applications
- **Tool Calling**: Structured function calling with automatic UI updates
- **Persistence**: Built-in chat history and session management

---

## Core Architecture

### 1. AI Core (`ai`)

The foundation layer that handles LLM interactions:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText, generateText, generateObject } from 'ai';

// Streaming text generation
const result = await streamText({
  model: openai('gpt-4-turbo'),
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Explain quantum computing' }
  ],
  temperature: 0.7,
  maxTokens: 1000,
});

// Non-streaming generation
const { text } = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Write a haiku about coding',
});

// Structured object generation
const { object } = await generateObject({
  model: openai('gpt-4-turbo'),
  schema: z.object({
    title: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string(),
  }),
  prompt: 'Create a task for implementing user authentication',
});
```

### 2. Provider System

Unified interface across providers:

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// Easy provider switching
const providers = {
  openai: openai('gpt-4-turbo'),
  claude: anthropic('claude-3-opus-20240229'),
  gemini: google('gemini-pro'),
};

// Use any provider with same interface
const result = await streamText({
  model: providers.claude, // Switch providers here
  messages,
});
```

---

## React Hooks

### 1. `useChat` - Complete Chat Interface

The most powerful hook for building chat applications:

```typescript
import { useChat } from 'ai/react';

function ChatComponent() {
  const {
    // State
    messages,        // Array of chat messages
    input,          // Current input value
    isLoading,      // Loading state
    error,          // Error state
    
    // Actions
    handleInputChange,  // Input change handler
    handleSubmit,      // Form submit handler
    append,           // Add message programmatically
    reload,           // Retry last message
    stop,             // Stop streaming
    setMessages,      // Update messages
    
    // Data
    data,            // Custom data from API
  } = useChat({
    // Configuration
    api: '/api/chat',
    id: 'chat-session-1',
    
    // Body data sent with each request
    body: {
      userId: 'user-123',
      context: 'customer-support',
    },
    
    // Headers
    headers: {
      'X-Custom-Header': 'value',
    },
    
    // Callbacks
    onFinish: (message) => {
      console.log('Message complete:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onResponse: (response) => {
      console.log('Response received:', response);
    },
    
    // Initial state
    initialMessages: [
      { id: '1', role: 'assistant', content: 'Hello! How can I help?' }
    ],
  });

  return (
    <div>
      {/* Message display */}
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
          
          {/* Tool invocations */}
          {m.toolInvocations?.map((tool, i) => (
            <ToolDisplay key={i} tool={tool} />
          ))}
        </div>
      ))}
      
      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button disabled={isLoading}>Send</button>
      </form>
      
      {/* Actions */}
      <button onClick={() => reload()}>Retry</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
}
```

### 2. `useCompletion` - Text Completion

For autocomplete and single completions:

```typescript
import { useCompletion } from 'ai/react';

function AutocompleteComponent() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useCompletion({
    api: '/api/completion',
    debounce: 500, // Debounce input
  });

  return (
    <div>
      <textarea
        value={input}
        onChange={handleInputChange}
        placeholder="Start typing..."
      />
      {completion && (
        <div className="suggestion">{completion}</div>
      )}
    </div>
  );
}
```

### 3. `useAssistant` - OpenAI Assistants API

For OpenAI Assistants with file support:

```typescript
import { useAssistant } from 'ai/react';

function AssistantComponent() {
  const {
    status,
    messages,
    input,
    submitMessage,
    handleInputChange,
  } = useAssistant({
    api: '/api/assistant',
    threadId: 'thread-123',
  });

  return (
    <div>
      {messages.map(m => (
        <Message key={m.id} message={m} />
      ))}
      <input value={input} onChange={handleInputChange} />
      <button onClick={submitMessage}>Send</button>
    </div>
  );
}
```

---

## Streaming Features

### 1. Text Streaming

Real-time streaming with proper backpressure handling:

```typescript
// API Route (Next.js App Router)
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    
    // Streaming options
    streamOptions: {
      // Send partial JSON objects
      experimental_streamData: true,
    },
    
    // Stream custom data
    onChunk: ({ chunk }) => {
      console.log('Chunk:', chunk);
    },
    
    // Token usage tracking
    onFinish: ({ usage }) => {
      console.log('Tokens used:', usage);
    },
  });
  
  // Return streaming response
  return result.toDataStreamResponse();
}
```

### 2. Data Streaming

Stream additional data alongside text:

```typescript
const result = streamText({
  model: openai('gpt-4-turbo'),
  messages,
});

// Stream custom data
const data = new StreamData();

// Append data during streaming
data.append({ source: 'knowledge-base', confidence: 0.95 });

// Return both text and data
return result.toDataStreamResponse(data);
```

---

## Tool Calling

### 1. Define Tools

Tools are functions the AI can call:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const tools = {
  // Simple tool
  getWeather: tool({
    description: 'Get weather for a location',
    parameters: z.object({
      location: z.string(),
      unit: z.enum(['celsius', 'fahrenheit']).optional(),
    }),
    execute: async ({ location, unit = 'celsius' }) => {
      const weather = await fetchWeather(location);
      return {
        temperature: weather.temp,
        unit,
        description: weather.description,
      };
    },
  }),
  
  // Database query tool
  searchDatabase: tool({
    description: 'Search company database',
    parameters: z.object({
      query: z.string(),
      table: z.enum(['users', 'products', 'orders']),
      limit: z.number().default(10),
    }),
    execute: async ({ query, table, limit }) => {
      const results = await db.select()
        .from(table)
        .where('name', 'like', `%${query}%`)
        .limit(limit);
      return results;
    },
  }),
  
  // Action tool
  createTask: tool({
    description: 'Create a new task',
    parameters: z.object({
      title: z.string(),
      assignee: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      dueDate: z.string().optional(),
    }),
    execute: async (params) => {
      const task = await db.tasks.create({ data: params });
      return { success: true, taskId: task.id };
    },
  }),
};
```

### 2. Use Tools in Chat

```typescript
const result = await streamText({
  model: openai('gpt-4-turbo'),
  messages,
  tools,
  toolChoice: 'auto', // or 'required', 'none', { name: 'toolName' }
  
  // Max rounds of tool calls
  maxToolRoundtrips: 3,
});

// Access tool results
for await (const part of result.fullStream) {
  switch (part.type) {
    case 'text-delta':
      console.log('Text:', part.textDelta);
      break;
    case 'tool-call':
      console.log('Tool called:', part.toolName, part.args);
      break;
    case 'tool-result':
      console.log('Tool result:', part.result);
      break;
  }
}
```

### 3. Client-Side Tool Rendering

```typescript
function ChatMessage({ message }) {
  return (
    <div>
      {message.content}
      
      {/* Render tool calls */}
      {message.toolInvocations?.map((invocation, index) => (
        <div key={index}>
          {invocation.state === 'call' && (
            <div>Calling {invocation.toolName}...</div>
          )}
          
          {invocation.state === 'result' && (
            <div>
              {invocation.toolName === 'getWeather' && (
                <WeatherCard data={invocation.result} />
              )}
              {invocation.toolName === 'searchDatabase' && (
                <DataTable results={invocation.result} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Persistence & Sessions

### 1. Chat Persistence

Save and restore chat sessions:

```typescript
// Save messages to database
import { saveChat, loadChat } from '@/lib/db';

function PersistentChat({ chatId }) {
  const { messages, setMessages } = useChat({
    id: chatId,
    
    // Load initial messages
    initialMessages: async () => {
      return await loadChat(chatId);
    },
    
    // Save on each message
    onFinish: async (message) => {
      await saveChat(chatId, messages);
    },
  });
  
  // Manual save
  const handleSave = async () => {
    await saveChat(chatId, messages);
  };
  
  return <ChatUI messages={messages} onSave={handleSave} />;
}
```

### 2. Session Management

```typescript
// API route with session
export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  
  // Load session context
  const session = await loadSession(sessionId);
  
  // Add context to system message
  const contextualMessages = [
    {
      role: 'system',
      content: `Context: ${JSON.stringify(session.context)}`,
    },
    ...messages,
  ];
  
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: contextualMessages,
  });
  
  // Save to session
  await updateSession(sessionId, {
    lastMessage: new Date(),
    messageCount: session.messageCount + 1,
  });
  
  return result.toDataStreamResponse();
}
```

---

## UI Components

### 1. Message Component with Rich Content

```typescript
import { Message } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

function RichMessage({ message }) {
  return (
    <div className="message">
      {/* Avatar */}
      <Avatar role={message.role} />
      
      {/* Content with markdown */}
      <div className="content">
        <ReactMarkdown
          components={{
            code: ({ language, children }) => (
              <SyntaxHighlighter language={language}>
                {children}
              </SyntaxHighlighter>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
      
      {/* Attachments */}
      {message.experimental_attachments?.map(attachment => (
        <Attachment key={attachment.name} {...attachment} />
      ))}
      
      {/* Tool calls */}
      {message.toolInvocations?.map(tool => (
        <ToolInvocation key={tool.toolCallId} {...tool} />
      ))}
      
      {/* Metadata */}
      <div className="metadata">
        <time>{message.createdAt}</time>
        {message.annotations?.map(annotation => (
          <Badge key={annotation.id}>{annotation.type}</Badge>
        ))}
      </div>
    </div>
  );
}
```

### 2. Streaming Indicator

```typescript
function StreamingIndicator({ isStreaming }) {
  return (
    <div className={cn('indicator', isStreaming && 'active')}>
      <div className="dots">
        <span />
        <span />
        <span />
      </div>
      {isStreaming && <span>AI is thinking...</span>}
    </div>
  );
}
```

### 3. Tool Status Display

```typescript
function ToolStatus({ toolInvocation }) {
  const statusConfig = {
    call: { icon: Loader2, text: 'Calling...', color: 'blue' },
    result: { icon: CheckCircle, text: 'Complete', color: 'green' },
    error: { icon: XCircle, text: 'Failed', color: 'red' },
  };
  
  const config = statusConfig[toolInvocation.state];
  const Icon = config.icon;
  
  return (
    <div className={`tool-status ${config.color}`}>
      <Icon className="animate-spin" />
      <span>{toolInvocation.toolName}</span>
      <span>{config.text}</span>
      
      {toolInvocation.state === 'result' && (
        <pre>{JSON.stringify(toolInvocation.result, null, 2)}</pre>
      )}
    </div>
  );
}
```

---

## Real-World Use Cases

### 1. Customer Support Chatbot

```typescript
// Integrates with CRM, knowledge base, and ticketing system
function SupportChat() {
  const { messages, input, handleSubmit } = useChat({
    api: '/api/support-chat',
    body: {
      customerId: getCurrentCustomer().id,
      context: 'support',
    },
    tools: {
      searchKnowledge: tool({
        description: 'Search knowledge base',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          return await searchKnowledgeBase(query);
        },
      }),
      createTicket: tool({
        description: 'Create support ticket',
        parameters: z.object({
          title: z.string(),
          priority: z.enum(['low', 'medium', 'high']),
          description: z.string(),
        }),
        execute: async (params) => {
          return await createSupportTicket(params);
        },
      }),
    },
  });
  
  return <ChatInterface messages={messages} onSubmit={handleSubmit} />;
}
```

### 2. Code Generation Assistant

```typescript
// AI pair programmer with code execution
function CodeAssistant() {
  const { messages, append } = useChat({
    api: '/api/code-assistant',
    tools: {
      executeCode: tool({
        description: 'Execute code snippet',
        parameters: z.object({
          language: z.enum(['javascript', 'python', 'sql']),
          code: z.string(),
        }),
        execute: async ({ language, code }) => {
          const result = await sandboxExecute(language, code);
          return { output: result.output, error: result.error };
        },
      }),
      searchDocs: tool({
        description: 'Search documentation',
        parameters: z.object({
          library: z.string(),
          query: z.string(),
        }),
        execute: async ({ library, query }) => {
          return await searchDocumentation(library, query);
        },
      }),
    },
  });
  
  return (
    <div className="code-assistant">
      <CodeEditor onExecute={(code) => append({
        role: 'user',
        content: `Execute this code: \`\`\`${code}\`\`\``,
      })} />
      <ChatMessages messages={messages} />
    </div>
  );
}
```

### 3. Data Analysis Dashboard

```typescript
// Interactive data analysis with visualizations
function DataAnalysis() {
  const { messages, data } = useChat({
    api: '/api/data-analysis',
    tools: {
      queryDatabase: tool({
        description: 'Query database with SQL',
        parameters: z.object({ sql: z.string() }),
        execute: async ({ sql }) => {
          const results = await db.raw(sql);
          return { data: results, rowCount: results.length };
        },
      }),
      createVisualization: tool({
        description: 'Create data visualization',
        parameters: z.object({
          type: z.enum(['bar', 'line', 'pie', 'scatter']),
          data: z.array(z.record(z.any())),
          config: z.record(z.any()),
        }),
        execute: async ({ type, data, config }) => {
          return { chartId: await createChart(type, data, config) };
        },
      }),
    },
  });
  
  return (
    <Dashboard>
      <ChatPanel messages={messages} />
      <VisualizationPanel charts={data?.charts} />
      <DataTablePanel results={data?.queryResults} />
    </Dashboard>
  );
}
```

### 4. Document Processing Pipeline

```typescript
// Process documents with AI
function DocumentProcessor() {
  const { messages, isLoading } = useChat({
    api: '/api/document-processor',
    tools: {
      extractText: tool({
        description: 'Extract text from document',
        parameters: z.object({ documentId: z.string() }),
        execute: async ({ documentId }) => {
          return await extractTextFromPDF(documentId);
        },
      }),
      summarize: tool({
        description: 'Summarize document section',
        parameters: z.object({
          text: z.string(),
          maxLength: z.number(),
        }),
        execute: async ({ text, maxLength }) => {
          return await generateSummary(text, maxLength);
        },
      }),
      extractEntities: tool({
        description: 'Extract named entities',
        parameters: z.object({ text: z.string() }),
        execute: async ({ text }) => {
          return await extractEntities(text);
        },
      }),
    },
  });
  
  return <DocumentUI messages={messages} loading={isLoading} />;
}
```

---

## Best Practices

### 1. Error Handling

```typescript
const { messages, error, reload } = useChat({
  api: '/api/chat',
  
  // Automatic retry
  onError: (error) => {
    if (error.message.includes('rate limit')) {
      setTimeout(() => reload(), 5000);
    }
  },
  
  // Max retries
  maxRetries: 3,
  
  // Retry delay
  retryDelay: 1000,
});

// Display errors
{error && (
  <ErrorBanner
    message={error.message}
    onRetry={() => reload()}
  />
)}
```

### 2. Performance Optimization

```typescript
// Debounce input
const { completion } = useCompletion({
  api: '/api/completion',
  debounce: 500,
});

// Lazy load messages
const { messages } = useChat({
  api: '/api/chat',
  initialMessages: () => loadMessages({ limit: 20 }),
});

// Virtual scrolling for long chats
<VirtualList
  items={messages}
  renderItem={(message) => <Message {...message} />}
/>
```

### 3. Security

```typescript
// Server-side validation
export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Validate and sanitize
  const validated = messageSchema.parse(messages);
  
  // Rate limiting
  const { success } = await rateLimit.check(req);
  if (!success) {
    return new Response('Rate limited', { status: 429 });
  }
  
  // Add security headers
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: validated,
    
    // Limit token usage
    maxTokens: 1000,
  });
  
  return result.toDataStreamResponse();
}
```

### 4. Monitoring

```typescript
// Track usage and performance
const { messages } = useChat({
  api: '/api/chat',
  
  onFinish: (message, { usage, finishReason }) => {
    // Log to analytics
    analytics.track('chat_message', {
      messageId: message.id,
      tokensUsed: usage.totalTokens,
      finishReason,
      duration: Date.now() - startTime,
    });
  },
});
```

### 5. Testing

```typescript
// Test chat components
import { render, screen } from '@testing-library/react';
import { mockUseChat } from '@/test-utils';

test('displays messages', () => {
  mockUseChat({
    messages: [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there!' },
    ],
  });
  
  render(<ChatComponent />);
  
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Hi there!')).toBeInTheDocument();
});
```

---

## Advanced Patterns

### 1. Multi-Agent System

```typescript
// Multiple AI agents working together
function MultiAgentChat() {
  const researcher = useChat({ api: '/api/researcher' });
  const analyst = useChat({ api: '/api/analyst' });
  const writer = useChat({ api: '/api/writer' });
  
  const handleQuery = async (query: string) => {
    // Research phase
    const research = await researcher.append({
      role: 'user',
      content: `Research: ${query}`,
    });
    
    // Analysis phase
    const analysis = await analyst.append({
      role: 'user',
      content: `Analyze: ${research.content}`,
    });
    
    // Writing phase
    const report = await writer.append({
      role: 'user',
      content: `Write report: ${analysis.content}`,
    });
    
    return report;
  };
  
  return <MultiAgentUI agents={{ researcher, analyst, writer }} />;
}
```

### 2. Streaming Aggregation

```typescript
// Aggregate data while streaming
function StreamingAggregator() {
  const [aggregatedData, setAggregatedData] = useState({});
  
  const { messages } = useChat({
    api: '/api/chat',
    experimental_onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'fetchData') {
        setAggregatedData(prev => ({
          ...prev,
          [toolCall.args.key]: toolCall.result,
        }));
      }
    },
  });
  
  return <AggregatedView data={aggregatedData} messages={messages} />;
}
```

### 3. Conditional Streaming

```typescript
// Stream different content based on conditions
export async function POST(req: Request) {
  const { messages, mode } = await req.json();
  
  if (mode === 'fast') {
    // Use smaller model for speed
    return streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      temperature: 0.3,
    }).toDataStreamResponse();
  } else if (mode === 'accurate') {
    // Use larger model for accuracy
    return streamText({
      model: openai('gpt-4-turbo'),
      messages,
      temperature: 0.7,
      tools, // Include tools for accurate mode
    }).toDataStreamResponse();
  }
}
```

---

## Conclusion

The Vercel AI SDK provides a comprehensive toolkit for building production-ready AI applications with:

- **Unified API** across providers
- **React-first** design with powerful hooks
- **Streaming** as a first-class citizen
- **Type safety** throughout
- **Tool calling** for extended capabilities
- **Persistence** for maintaining context

It's particularly well-suited for:
- Chat applications
- AI assistants
- Code generation tools
- Data analysis dashboards
- Document processing pipelines
- Customer support systems

The SDK handles the complex aspects of AI integration (streaming, retries, tool calling) while providing a clean, React-friendly API that makes building AI-powered UIs straightforward and enjoyable.