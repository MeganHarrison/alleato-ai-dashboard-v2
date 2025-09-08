# AI SDK UI Elements

## Setup

Installing AI Elements is straightforward and can be done in a couple of ways. You can use the dedicated CLI command for the fastest setup, or integrate via the standard shadcn/ui CLI if you’ve already adopted shadcn’s workflow.

<ElementsInstaller />

### Prerequisites

Before installing AI Elements, make sure your environment meets the following requirements:

- [Node.js](https://nodejs.org/en/download/), version 18 or later
- A [Next.js](https://nextjs.org/) project with the [AI SDK](https://ai-sdk.dev/) installed.
- [shadcn/ui](https://ui.shadcn.com/) installed in your project. In practice, this means you have already initialized shadcn in your project (for example by running `npx shadcn@latest init` and configuring Tailwind CSS). AI Elements currently supports only the CSS Variables mode of shadcn/ui for theming.
- We also highly recommend using the [AI Gateway](https://vercel.com/docs/ai-gateway) and adding `AI_GATEWAY_API_KEY` to your `env.local` so you don't have to use an API key from every provider. AI Gateway also gives $5 in usage per month so you can experiment with models. You can obtain an API key [here](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys&title=Get%20your%20AI%20Gateway%20key).

### Installing Components

You can install AI Elements components using either the AI Elements CLI or the shadcn/ui CLI. Both achieve the same result: adding the selected component’s code and any needed dependencies to your project.

The CLI will download the component’s code and integrate it into your project’s directory (usually under your components folder). By default, AI Elements components are added to the `@/components/ai-elements/` directory (or whatever folder you’ve configured in your shadcn components settings).

After running the command, you should see a confirmation in your terminal that the files were added. You can then proceed to use the component in your code.


### Usage

Once an AI Elements component is installed, you can import it and use it in your application like any other React component. The components are added as part of your codebase (not hidden in a library), so the usage feels very natural.

### Example

After installing AI Elements components, you can use them in your application like any other React component. For example:

```tsx title="conversation.tsx"
'use client';

import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

const Example = () => {
  const { messages } = useChat();

  return (
    <>
      {messages.map(({ role, parts }, index) => (
        <Message from={role} key={index}>
          <MessageContent>
            {parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <Response key={`${role}-${i}`}>{part.text}</Response>;
              }
            })}
          </MessageContent>
        </Message>
      ))}
    </>
  );
};

export default Example;
```

In the example above, we import the `Message` component from our AI Elements directory and include it in our JSX. Then, we compose the component with the `MessageContent` and `Response` subcomponents. You can style or configure the component just as you would if you wrote it yourself – since the code lives in your project, you can even open the component file to see how it works or make custom modifications.

### Extensibility

All AI Elements components take as many primitive attributes as possible. For example, the `Message` component extends `HTMLAttributes<HTMLDivElement>`, so you can pass any props that a `div` supports. This makes it easy to extend the component with your own styles or functionality.

### Customization

<Note>
  If you re-install AI Elements by rerunning `npx ai-elements@latest`, the CLI
  will ask before overwriting the file so you can save any custom changes you
  made.
</Note>

After installation, no additional setup is needed. The component’s styles (Tailwind CSS classes) and scripts are already integrated. You can start interacting with the component in your app immediately.

For example, if you'd like to remove the rounding on `Message`, you can go to `components/ai-elements/message.tsx` and remove `rounded-lg` as follows:

```tsx filename="components/ai-elements/message.tsx" highlight="8"
export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      'flex flex-col gap-2 text-sm text-foreground',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground group-[.is-user]:px-4 group-[.is-user]:py-3',
      className,
    )}
    {...props}
  >
    <div className="is-user:dark">{children}</div>
  </div>
);
```

## Troubleshooting

### Why are my components not styled?

Make sure your project is configured correctly for shadcn/ui in Tailwind 4 - this means having a `globals.css` file that imports Tailwind and includes the shadcn/ui base styles.

### I ran the AI Elements CLI but nothing was added to my project

Double-check that:

- Your current working directory is the root of your project (where `package.json` lives).
- Your components.json file (if using shadcn-style config) is set up correctly.
- You’re using the latest version of the AI Elements CLI:

```bash
npx ai-elements@latest
```

If all else fails, feel free to open an [issue on GitHub](https://github.com/vercel/ai-elements/issues).

### Theme switching doesn’t work — my app stays in light mode

Ensure your app is using the same data-theme system that shadcn/ui and AI Elements expect. The default implementation toggles a data-theme attribute on the `<html>` element. Make sure your tailwind.config.js is using class or data- selectors accordingly:

### The component imports fail with “module not found”

Check the file exists. If it does, make sure your `tsconfig.json` has a proper paths alias for `@/` i.e.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### My AI coding assistant can't access AI Elements components

1. Verify your config file syntax is valid JSON.
2. Check that the file path is correct for your AI tool.
3. Restart your coding assistant after making changes.
4. Ensure you have a stable internet connection.

### Still stuck?

If none of these answers help, open an [issue on GitHub](https://github.com/vercel/ai-elements/issues) and someone will be happy to assist.


## Actions

The `Actions` component provides a flexible row of action buttons for AI responses with common actions like retry, like, dislike, copy, and share.

<Preview path="actions" />

#### Installation

```sh
npx ai-elements@latest add actions
```

#### Usage

```tsx
import { Actions, Action } from '@/components/ai-elements/actions';
import { ThumbsUpIcon } from 'lucide-react';
```

```tsx
<Actions className="mt-2">
  <Action label="Like">
    <ThumbsUpIcon className="size-4" />
  </Action>
</Actions>
```

#### Usage with AI SDK

Build a simple chat UI where the user can copy or regenerate the most recent message.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { useState } from 'react';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { RefreshCcwIcon, CopyIcon } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

const ActionsDemo = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message, messageIndex) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        const isLastMessage =
                          messageIndex === messages.length - 1;
                        return (
                          <div key={`${message.id}-${i}`}>
                            <Response>{part.text}</Response>
                            {message.role === 'assistant' && isLastMessage && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                                <Action
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default ActionsDemo;
```

Add the following route to your backend:

```tsx filename="api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { model, messages }: { messages: UIMessage[]; model: string } =
    await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

#### Features

- Row of composable action buttons with consistent styling
- Support for custom actions with tooltips
- Hover-to-show behavior by default (configurable)
- State management for toggle actions (like, dislike, favorite)
- Keyboard accessible with proper ARIA labels
- Clipboard and Web Share API integration
- TypeScript support with proper type definitions
- Consistent with design system styling

### Examples

<Preview path="actions-hover" />

#### Props

##### `<Actions />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'HTML attributes to spread to the root div.',
    },
  ]}
/>

##### `<Action />`

<PropertiesTable
  content={[
    {
      name: 'tooltip',
      type: 'string',
      description: 'Optional tooltip text shown on hover.',
      isOptional: true,
    },
    {
      name: 'label',
      type: 'string',
      description:
        'Accessible label for screen readers. Also used as fallback if tooltip is not provided.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
    },
  ]}
/>

## Branch

The `Branch` component manages multiple versions of AI messages, allowing users to navigate between different response branches. It provides a clean, modern interface with customizable themes and keyboard-accessible navigation buttons.

<Preview path="branch" />

#### Installation

```sh
npx ai-elements@latest add branch
```

#### Usage

```tsx
import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from '@/components/ai-elements/branch';
```

```tsx
<Branch defaultBranch={0}>
  <BranchMessages>
    <Message from="user">
      <MessageContent>Hello</MessageContent>
    </Message>
    <Message from="user">
      <MessageContent>Hi!</MessageContent>
    </Message>
  </BranchMessages>
  <BranchSelector from="user">
    <BranchPrevious />
    <BranchPage />
    <BranchNext />
  </BranchSelector>
</Branch>
```

#### Usage with AI SDK

<Note>
  Branching is an advanced use case that you can implement yourself to suit your
  application's needs. While the AI SDK does not provide built-in support for
  branching, you have full flexibility to design and manage multiple response
  paths as required.
</Note>

#### Features

- Context-based state management for multiple message branches
- Navigation controls for moving between branches (previous/next)
- Uses CSS to prevent re-rendering of branches when switching
- Branch counter showing current position (e.g., "1 of 3")
- Automatic branch tracking and synchronization
- Callbacks for branch change and navigation using `onBranchChange`
- Support for custom branch change callbacks
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes
- Keyboard-accessible navigation buttons

#### Props

###$# `<Branch />`

<PropertiesTable
  content={[
    {
      name: 'defaultBranch',
      type: 'number',
      description: 'The index of the branch to show by default (default: 0).',
      isOptional: true,
    },
    {
      name: 'onBranchChange',
      type: '(branchIndex: number) => void',
      description: 'Callback fired when the branch changes.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
    },
  ]}
/>

##### `<BranchMessages />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
    },
  ]}
/>

##### `<BranchSelector />`

<PropertiesTable
  content={[
    {
      name: 'from',
      type: 'UIMessage["role"]',
      description:
        'Aligns the selector for user, assistant or system messages.',
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the selector container.',
    },
  ]}
/>

##### `<BranchPrevious />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
    },
  ]}
/>

##### `<BranchNext />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
    },
  ]}
/>

##### `<BranchPage />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLSpanElement>',
      description: 'Any other props are spread to the underlying span element.',
    },
  ]}
/>


## Code Block

The `CodeBlock` component provides syntax highlighting, line numbers, and copy to clipboard functionality for code blocks.

<Preview path="code-block" />

#### Installation

```sh
npx ai-elements@latest add code-block
```

#### Usage

```tsx
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
```

```tsx
<CodeBlock data={"console.log('hello world')"} language="jsx">
  <CodeBlockCopyButton
    onCopy={() => console.log('Copied code to clipboard')}
    onError={() => console.error('Failed to copy code to clipboard')}
  />
</CodeBlock>
```

#### Usage with AI SDK

Build a simple code generation tool using the [`experimental_useObject`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object) hook.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { codeBlockSchema } from '@/app/api/codegen/route';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block';
import { useState } from 'react';

export default function Page() {
  const [input, setInput] = useState('');
  const { object, submit, isLoading } = useObject({
    api: '/api/codegen',
    schema: codeBlockSchema,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      submit(input);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto mb-4">
          {object?.code && object?.language && (
            <CodeBlock
              code={object.code}
              language={object.language}
              showLineNumbers={true}
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          )}
        </div>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Generate a React todolist component"
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={isLoading ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
}
```

Add the following route to your backend:

```tsx filename="api/codegen/route.ts"
import { streamObject } from 'ai';
import { z } from 'zod';

export const codeBlockSchema = z.object({
  language: z.string(),
  filename: z.string(),
  code: z.string(),
});
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const context = await req.json();

  const result = streamObject({
    model: 'openai/gpt-4o',
    schema: codeBlockSchema,
    prompt:
      `You are a helpful coding assitant. Only generate code, no markdown formatting or backticks, or text.` +
      context,
  });

  return result.toTextStreamResponse();
}
```

#### Features

- Syntax highlighting with react-syntax-highlighter
- Line numbers (optional)
- Copy to clipboard functionality
- Automatic light/dark theme switching
- Customizable styles
- Accessible design

### Examples

##### Dark Mode

To use the `CodeBlock` component in dark mode, you can wrap it in a `div` with the `dark` class.

<Preview path="code-block-dark" />

### Props

### `<CodeBlock />`

<PropertiesTable
  content={[
    {
      name: 'code',
      type: 'string',
      description: 'The code content to display.',
    },
    {
      name: 'language',
      type: 'string',
      description: 'The programming language for syntax highlighting.',
    },
    {
      name: 'showLineNumbers',
      type: 'boolean',
      description: 'Whether to show line numbers. Default: false.',
      isOptional: true,
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Child elements (like CodeBlockCopyButton) positioned in the top-right corner.',
      isOptional: true,
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes to apply to the root container.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>

### `<CodeBlockCopyButton />`

<PropertiesTable
  content={[
    {
      name: 'onCopy',
      type: '() => void',
      description: 'Callback fired after a successful copy.',
      isOptional: true,
    },
    {
      name: 'onError',
      type: '(error: Error) => void',
      description: 'Callback fired if copying fails.',
      isOptional: true,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'How long to show the copied state (ms). Default: 2000.',
      isOptional: true,
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Custom content for the button. Defaults to copy/check icons.',
      isOptional: true,
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes to apply to the button.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
      isOptional: true,
    },
  ]}
/>


## Conversation

The `Conversation` component wraps messages and automatically scrolls to the bottom. Also includes a scroll button that appears when not at the bottom.

<Preview path="conversation" className="p-0" />

### Installation

```sh
npx ai-elements@latest add conversation
```

### Usage

```tsx
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
```

```tsx
<Conversation className="relative w-full" style={{ height: '500px' }}>
  <ConversationContent>
    <Message from={'user'}>
      <MessageContent>Hi there!</MessageContent>
    </Message>
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

### Usage with AI SDK

Build a simple conversational UI with `Conversation` and [`PromptInput`](/elements/components/prompt-input):

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

const ConversationDemo = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text': // we don't use any reasoning or tool calls in this example
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default ConversationDemo;
```

Add the following route to your backend:

```tsx filename="api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Features

- Automatic scrolling to the bottom when new messages are added
- Smooth scrolling behavior with configurable animation
- Scroll button that appears when not at the bottom
- Responsive design with customizable padding and spacing
- Flexible content layout with consistent message spacing
- Accessible with proper ARIA roles for screen readers
- Customizable styling through className prop
- Support for any number of child message components

### Props

### `<Conversation />`

<PropertiesTable
  content={[
    {
      name: 'contextRef',
      type: 'React.Ref<StickToBottomContext>',
      description: 'Optional ref to access the StickToBottom context object.',
    },
    {
      name: 'instance',
      type: 'StickToBottomInstance',
      description:
        'Optional instance for controlling the StickToBottom component.',
    },
    {
      name: 'children',
      type: '((context: StickToBottomContext) => ReactNode) | ReactNode',
      description:
        'Render prop or ReactNode for custom rendering with context.',
    },
    {
      name: '[...props]',
      type: 'Omit<React.HTMLAttributes<HTMLDivElement>, "children">',
      description: 'Any other props are spread to the root div.',
    },
  ]}
/>

### `<ConversationContent />`

<PropertiesTable
  content={[
    {
      name: 'children',
      type: '((context: StickToBottomContext) => ReactNode) | ReactNode',
      description:
        'Render prop or ReactNode for custom rendering with context.',
    },
    {
      name: '[...props]',
      type: 'Omit<React.HTMLAttributes<HTMLDivElement>, "children">',
      description: 'Any other props are spread to the root div.',
    },
  ]}
/>

### `<ConversationScrollButton />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
    },
  ]}
/>


## Image

The `Image` component displays AI-generated images from the AI SDK. It accepts a [`Experimental_GeneratedImage`](/docs/reference/ai-sdk-core/generate-image) object from the AI SDK's `generateImage` function and automatically renders it as an image.

<Preview path="image" />

### Installation

```sh
npx ai-elements@latest add image
```

#### Usage

```tsx
import { Image } from '@/components/ai-elements/image';
```

```tsx
<Image
  base64="valid base64 string"
  mediaType: 'image/jpeg',
  uint8Array: new Uint8Array([]),
  alt="Example generated image"
  className="h-[150px] aspect-square border"
/>
```

#### Usage with AI SDK

Build a simple app allowing a user to generate an image given a prompt.

Install the `@ai-sdk/openai` package:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn']}>
    <Tab>
      <Snippet text="pnpm add @ai-sdk/openai" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install @ai-sdk/openai" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add @ai-sdk/openai" dark />
    </Tab>
  </Tabs>
</div>

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { Image } from '@/components/ai-elements/image';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { Loader } from '@/components/ai-elements/loader';

const ImageDemo = () => {
  const [prompt, setPrompt] = useState('A futuristic cityscape at sunset');
  const [imageData, setImageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setPrompt('');

    setIsLoading(true);
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      setImageData(data);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          {imageData && (
            <div className="flex justify-center">
              <Image
                {...imageData}
                alt="Generated image"
                className="h-[300px] aspect-square border rounded-lg"
              />
            </div>
          )}
          {isLoading && <Loader />}
        </div>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={prompt}
            placeholder="Describe the image you want to generate..."
            onChange={(e) => setPrompt(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={isLoading ? 'submitted' : 'ready'}
            disabled={!prompt.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default ImageDemo;
```

Add the following route to your backend:

```ts filename="app/api/image/route.ts"
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage } from 'ai';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const { image } = await experimental_generateImage({
    model: openai.image('dall-e-3'),
    prompt: prompt,
    size: '1024x1024',
  });

  return Response.json({
    base64: image.base64,
    uint8Array: image.uint8Array,
    mediaType: image.mediaType,
  });
}
```

### Features

- Accepts `Experimental_GeneratedImage` objects directly from the AI SDK
- Automatically creates proper data URLs from base64-encoded image data
- Supports all standard HTML image attributes
- Responsive by default with `max-w-full h-auto` styling
- Customizable with additional CSS classes
- Includes proper TypeScript types for AI SDK compatibility

### Props

### `<Image />`

<PropertiesTable
  content={[
    {
      name: 'alt',
      type: 'string',
      description: 'Alternative text for the image.',
      isOptional: true,
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes to apply to the image.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'Experimental_GeneratedImage',
      description: 'The image data to display, as returned by the AI SDK.',
      isOptional: true,
    },
  ]}
/>

## Inline Citation

The `InlineCitation` component provides a way to display citations inline with text content, similar to academic papers or research documents. It consists of a citation pill that shows detailed source information on hover, making it perfect for AI-generated content that needs to reference sources.

<Preview path="inline-citation" />

### Installation

```sh
npx ai-elements@latest add inline-citation
```

### Usage

```tsx
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationSource,
  InlineCitationText,
} from '@/components/ai-elements/inline-citation';
```

```tsx
<InlineCitation>
  <InlineCitationText>{citation.text}</InlineCitationText>
  <InlineCitationCard>
    <InlineCitationCardTrigger
      sources={citation.sources.map((source) => source.url)}
    />
    <InlineCitationCardBody>
      <InlineCitationCarousel>
        <InlineCitationCarouselHeader>
          <InlineCitationCarouselIndex />
        </InlineCitationCarouselHeader>
        <InlineCitationCarouselContent>
          <InlineCitationCarouselItem>
            <InlineCitationSource
              title="AI SDK"
              url="https://ai-sdk.dev"
              description="The AI Toolkit for TypeScript"
            />
          </InlineCitationCarouselItem>
        </InlineCitationCarouselContent>
      </InlineCitationCarousel>
    </InlineCitationCardBody>
  </InlineCitationCard>
</InlineCitation>
```

### Usage with AI SDK

Build citations for AI-generated content using [`experimental_generateObject`](/docs/reference/ai-sdk-ui/use-object).

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote,
} from '@/components/ai-elements/inline-citation';
import { Button } from '@/components/ui/button';
import { citationSchema } from '@/app/api/citation/route';

const CitationDemo = () => {
  const { object, submit, isLoading } = useObject({
    api: '/api/citation',
    schema: citationSchema,
  });

  const handleSubmit = (topic: string) => {
    submit({ prompt: topic });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => handleSubmit('artificial intelligence')}
          disabled={isLoading}
          variant="outline"
        >
          Generate AI Content
        </Button>
        <Button
          onClick={() => handleSubmit('climate change')}
          disabled={isLoading}
          variant="outline"
        >
          Generate Climate Content
        </Button>
      </div>

      {isLoading && !object && (
        <div className="text-muted-foreground">
          Generating content with citations...
        </div>
      )}

      {object?.content && (
        <div className="prose prose-sm max-w-none">
          <p className="leading-relaxed">
            {object.content.split(/(\[\d+\])/).map((part, index) => {
              const citationMatch = part.match(/\[(\d+)\]/);
              if (citationMatch) {
                const citationNumber = citationMatch[1];
                const citation = object.citations?.find(
                  (c: any) => c.number === citationNumber,
                );

                if (citation) {
                  return (
                    <InlineCitation key={index}>
                      <InlineCitationCard>
                        <InlineCitationCardTrigger sources={[citation.url]} />
                        <InlineCitationCardBody>
                          <InlineCitationCarousel>
                            <InlineCitationCarouselHeader>
                              <InlineCitationCarouselPrev />
                              <InlineCitationCarouselNext />
                              <InlineCitationCarouselIndex />
                            </InlineCitationCarouselHeader>
                            <InlineCitationCarouselContent>
                              <InlineCitationCarouselItem>
                                <InlineCitationSource
                                  title={citation.title}
                                  url={citation.url}
                                  description={citation.description}
                                />
                                {citation.quote && (
                                  <InlineCitationQuote>
                                    {citation.quote}
                                  </InlineCitationQuote>
                                )}
                              </InlineCitationCarouselItem>
                            </InlineCitationCarouselContent>
                          </InlineCitationCarousel>
                        </InlineCitationCardBody>
                      </InlineCitationCard>
                    </InlineCitation>
                  );
                }
              }
              return part;
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default CitationDemo;
```

Add the following route to your backend:

```ts filename="app/api/citation/route.ts"
import { streamObject } from 'ai';
import { z } from 'zod';

export const citationSchema = z.object({
  content: z.string(),
  citations: z.array(
    z.object({
      number: z.string(),
      title: z.string(),
      url: z.string(),
      description: z.string().optional(),
      quote: z.string().optional(),
    }),
  ),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: 'openai/gpt-4o',
    schema: citationSchema,
    prompt: `Generate a well-researched paragraph about ${prompt} with proper citations. 
    
    Include:
    - A comprehensive paragraph with inline citations marked as [1], [2], etc.
    - 2-3 citations with realistic source information
    - Each citation should have a title, URL, and optional description/quote
    - Make the content informative and the sources credible
    
    Format citations as numbered references within the text.`,
  });

  return result.toTextStreamResponse();
}
```

### Features

- Hover interaction to reveal detailed citation information
- **Carousel navigation** for multiple citations with prev/next controls
- **Live index tracking** showing current slide position (e.g., "1/5")
- Support for source titles, URLs, and descriptions
- Optional quote blocks for relevant excerpts
- Composable architecture for flexible citation formats
- Accessible design with proper keyboard navigation
- Seamless integration with AI-generated content
- Clean visual design that doesn't disrupt reading flow
- Smart badge display showing source hostname and count

### Props

#### `<InlineCitation />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"span">',
      description: 'Any other props are spread to the root span element.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationText />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"span">',
      description: 'Any other props are spread to the underlying span element.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCard />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"span">',
      description: 'Any other props are spread to the HoverCard component.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCardTrigger />`

<PropertiesTable
  content={[
    {
      name: 'sources',
      type: 'string[]',
      description:
        'Array of source URLs. The length determines the number displayed in the badge.',
      isOptional: false,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<"button">',
      description:
        'Any other props are spread to the underlying button element.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCardBody />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarousel />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Carousel>',
      description:
        'Any other props are spread to the underlying Carousel component.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarouselContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description:
        'Any other props are spread to the underlying CarouselContent component.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarouselItem />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarouselHeader />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarouselIndex />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description:
        'Any other props are spread to the underlying div. Children will override the default index display.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarouselPrev />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CarouselPrevious>',
      description:
        'Any other props are spread to the underlying CarouselPrevious component.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationCarouselNext />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CarouselNext>',
      description:
        'Any other props are spread to the underlying CarouselNext component.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationSource />`

<PropertiesTable
  content={[
    {
      name: 'title',
      type: 'string',
      description: 'The title of the source.',
      isOptional: true,
    },
    {
      name: 'url',
      type: 'string',
      description: 'The URL of the source.',
      isOptional: true,
    },
    {
      name: 'description',
      type: 'string',
      description: 'A brief description of the source.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>

#### `<InlineCitationQuote />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"blockquote">',
      description:
        'Any other props are spread to the underlying blockquote element.',
      isOptional: true,
    },
  ]}
/>


## Loader

The `Loader` component provides a spinning animation to indicate loading states in your AI applications. It includes both a customizable wrapper component and the underlying icon for flexible usage.

<Preview path="loader" />

### Installation

```sh
npx ai-elements@latest add loader
```

### Usage

```tsx
import { Loader } from '@/components/ai-elements/loader';
```

```tsx
<Loader />
```

### Usage with AI SDK

Build a simple chat app that displays a loader before it the response streans by using `status === "submitted"`.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Loader } from '@/components/ai-elements/loader';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

const LoaderDemo = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <div key={`${message.id}-${i}`}>{part.text}</div>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default LoaderDemo;
```

Add the following route to your backend:

```ts filename="app/api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { model, messages }: { messages: UIMessage[]; model: string } =
    await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Features

- Clean, modern spinning animation using CSS animations
- Configurable size with the `size` prop
- Customizable styling with CSS classes
- Built-in `animate-spin` animation with proper centering
- Exports both `AILoader` wrapper and `LoaderIcon` for flexible usage
- Supports all standard HTML div attributes
- TypeScript support with proper type definitions
- Optimized SVG icon with multiple opacity levels for smooth animation
- Uses `currentColor` for proper theme integration
- Responsive and accessible design

### Examples

#### Different Sizes

<Preview path="loader-sizes" />

#### Custom Styling

<Preview path="loader-custom" />

### Props

### `<Loader />`

<PropertiesTable
  content={[
    {
      name: 'size',
      type: 'number',
      description:
        'The size (width and height) of the loader in pixels. Defaults to 16.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>


## Message

The `Message` component displays a chat interface message from either a user or an AI. It includes an avatar, a name, and a message content.

<Preview path="message" />

### Installation

```sh
npx ai-elements@latest add message
```

### Usage

```tsx
import { Message, MessageContent } from '@/components/ai-elements/message';
```

```tsx
<Message from="user">
  <MessageContent>Hi there!</MessageContent>
</Message>
```

### Usage with AI SDK

Render messages in a list with `useChat`.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { Message, MessageContent } from '@/components/ai-elements/message';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

const MessageDemo = () => {
  const { messages } = useChat();

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text': // we don't use any reasoning or tool calls in this example
                    return (
                      <Response key={`${message.id}-${i}`}>
                        {part.text}
                      </Response>
                    );
                  default:
                    return null;
                }
              })}
            </MessageContent>
          </Message>
        ))}
      </div>
    </div>
  );
};

export default MessageDemo;
```

### Features

- Displays messages from both the user and AI assistant with distinct styling.
- Includes avatar images for message senders with fallback initials.
- Shows the sender's name through avatar fallbacks.
- Automatically aligns user and assistant messages on opposite sides.
- Uses different background colors for user and assistant messages.
- Accepts any React node as message content.

## Notes

Always render the `AIMessageContent` first, then the `AIMessageAvatar`. The `AIMessage` component is a wrapper that determines the alignment of the message.

## Examples

### Render Markdown

We can use the [`Response`](/elements/components/response) component to render markdown content.

<Preview path="message-markdown" />

### Props

### `<Message />`

<PropertiesTable
  content={[
    {
      name: 'from',
      type: 'UIMessage["role"]',
      description:
        'The role of the message sender ("user", "assistant", or "system").',
      isOptional: false,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>

### `<MessageContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the content div.',
      isOptional: true,
    },
  ]}
/>

### `<MessageAvatar />`

<PropertiesTable
  content={[
    {
      name: 'src',
      type: 'string',
      description: 'The URL of the avatar image.',
      isOptional: false,
    },
    {
      name: 'name',
      type: 'string',
      description:
        'The name to use for the avatar fallback (first 2 letters shown if image is missing).',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Avatar>',
      description:
        'Any other props are spread to the underlying Avatar component.',
      isOptional: true,
    },
  ]}
/>


# Conversation

The `Conversation` component wraps messages and automatically scrolls to the bottom. Also includes a scroll button that appears when not at the bottom.

<Preview path="conversation" className="p-0" />

### Installation

```sh
npx ai-elements@latest add conversation
```

### Usage

```tsx
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
```

```tsx
<Conversation className="relative w-full" style={{ height: '500px' }}>
  <ConversationContent>
    <Message from={'user'}>
      <MessageContent>Hi there!</MessageContent>
    </Message>
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

### Usage with AI SDK

Build a simple conversational UI with `Conversation` and [`PromptInput`](/elements/components/prompt-input):

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

const ConversationDemo = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text': // we don't use any reasoning or tool calls in this example
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default ConversationDemo;
```

Add the following route to your backend:

```tsx filename="api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Features

- Automatic scrolling to the bottom when new messages are added
- Smooth scrolling behavior with configurable animation
- Scroll button that appears when not at the bottom
- Responsive design with customizable padding and spacing
- Flexible content layout with consistent message spacing
- Accessible with proper ARIA roles for screen readers
- Customizable styling through className prop
- Support for any number of child message components

### Props

### `<Conversation />`

<PropertiesTable
  content={[
    {
      name: 'contextRef',
      type: 'React.Ref<StickToBottomContext>',
      description: 'Optional ref to access the StickToBottom context object.',
    },
    {
      name: 'instance',
      type: 'StickToBottomInstance',
      description:
        'Optional instance for controlling the StickToBottom component.',
    },
    {
      name: 'children',
      type: '((context: StickToBottomContext) => ReactNode) | ReactNode',
      description:
        'Render prop or ReactNode for custom rendering with context.',
    },
    {
      name: '[...props]',
      type: 'Omit<React.HTMLAttributes<HTMLDivElement>, "children">',
      description: 'Any other props are spread to the root div.',
    },
  ]}
/>

### `<ConversationContent />`

<PropertiesTable
  content={[
    {
      name: 'children',
      type: '((context: StickToBottomContext) => ReactNode) | ReactNode',
      description:
        'Render prop or ReactNode for custom rendering with context.',
    },
    {
      name: '[...props]',
      type: 'Omit<React.HTMLAttributes<HTMLDivElement>, "children">',
      description: 'Any other props are spread to the root div.',
    },
  ]}
/>

### `<ConversationScrollButton />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
    },
  ]}
/>


# Prompt Input

The `PromptInput` component allows a user to send a message to a large language model. It includes a textarea, a submit button, and a dropdown for selecting the model.

<Preview path="prompt-input" />

### Installation

```sh
npx ai-elements@latest add prompt-input
```

### Usage

```tsx
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from '@/components/ai-elements/prompt-input';
```

```tsx
<PromptInput onSubmit={() => {}} className="mt-4 relative">
  <PromptInputTextarea onChange={(e) => {}} value={''} />
  <PromptInputToolbar>
    <PromptInputSubmit
      className="absolute right-1 bottom-1"
      disabled={false}
      status={'ready'}
    />
  </PromptInputToolbar>
</PromptInput>
```

### Usage with AI SDK

Built a fully functional chat app using `PromptInput`, [`Conversation`](/elements/components/conversation) with a model picker:

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon, MicIcon } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';

const models = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus' },
];

const InputDemo = () => {
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(
      { text: text },
      {
        body: {
          model: model,
        },
      },
    );
    setText('');
  };

  const { messages, status, sendMessage } = useChat();

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton>
                <MicIcon size={16} />
              </PromptInputButton>
              <PromptInputButton>
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default InputDemo;
```

Add the following route to your backend:

```ts filename="app/api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { model, messages }: { messages: UIMessage[]; model: string } =
    await req.json();

  const result = streamText({
    model: model,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Features

- Auto-resizing textarea that adjusts height based on content
- Automatic submit button icons based on status
- Support for keyboard shortcuts (Cmd/Ctrl + Enter to submit)
- Customizable min/max height for the textarea
- Flexible toolbar with support for custom actions and tools
- Built-in model selection dropdown
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes
- Form-based submission handling

### Props

### `<PromptInput />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLFormElement>',
      description: 'Any other props are spread to the root form element.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputTextarea />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Textarea>',
      description:
        'Any other props are spread to the underlying Textarea component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputToolbar />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the toolbar div.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputTools />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the tools div.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputButton />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputSubmit />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputModelSelect />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Select>',
      description:
        'Any other props are spread to the underlying Select component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputModelSelectTrigger />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof SelectTrigger>',
      description:
        'Any other props are spread to the underlying SelectTrigger component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputModelSelectContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof SelectContent>',
      description:
        'Any other props are spread to the underlying SelectContent component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputModelSelectItem />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof SelectItem>',
      description:
        'Any other props are spread to the underlying SelectItem component.',
      isOptional: true,
    },
  ]}
/>

### `<PromptInputModelSelectValue />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof SelectValue>',
      description:
        'Any other props are spread to the underlying SelectValue component.',
      isOptional: true,
    },
  ]}
/>


# Reasoning

The `Reasoning` component displays AI reasoning content, automatically opening during streaming and closing when finished.

<Preview path="reasoning" />

### Installation

```sh
npx ai-elements@latest add reasoning
```

### Usage

```tsx
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
```

```tsx
<Reasoning className="w-full" isStreaming={false}>
  <ReasoningTrigger />
  <ReasoningContent>I need to computer the square of 2.</ReasoningContent>
</Reasoning>
```

### Usage with AI SDK

Build a chatbot with reasoning using Deepseek R1.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Loader } from '@/components/ai-elements/loader';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from @/components/ai-elements/response';

const ReasoningDemo = () => {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={status === 'streaming'}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </PromptInput>
      </div>
    </div>
  );
};

export default ReasoningDemo;
```

Add the following route to your backend:

```ts filename="app/api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { model, messages }: { messages: UIMessage[]; model: string } =
    await req.json();

  const result = streamText({
    model: 'deepseek/deepseek-r1',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
```

### Features

- Automatically opens when streaming content and closes when finished
- Manual toggle control for user interaction
- Smooth animations and transitions powered by Radix UI
- Visual streaming indicator with pulsing animation
- Composable architecture with separate trigger and content components
- Built with accessibility in mind including keyboard navigation
- Responsive design that works across different screen sizes
- Seamlessly integrates with both light and dark themes
- Built on top of shadcn/ui Collapsible primitives
- TypeScript support with proper type definitions

### Props

### `<Reasoning />`

<PropertiesTable
  content={[
    {
      name: 'isStreaming',
      type: 'boolean',
      description:
        'Whether the reasoning is currently streaming (auto-opens and closes the panel).',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Collapsible>',
      description:
        'Any other props are spread to the underlying Collapsible component.',
      isOptional: true,
    },
  ]}
/>

### `<ReasoningTrigger />`

<PropertiesTable
  content={[
    {
      name: 'title',
      type: 'string',
      description:
        'Optional title to display in the trigger (default: "Reasoning").',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CollapsibleTrigger>',
      description:
        'Any other props are spread to the underlying CollapsibleTrigger component.',
      isOptional: true,
    },
  ]}
/>

### `<ReasoningContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CollapsibleContent>',
      description:
        'Any other props are spread to the underlying CollapsibleContent component.',
      isOptional: true,
    },
  ]}
/>


# Response

The `Response` component renders a Markdown response from a large language model. It uses [Streamdown](https://streamdown.ai/) under the hood to render the markdown.

<Preview path="response" />

### Installation

```sh
npx ai-elements@latest add response
```

### Usage

```tsx
import { Response } from '@/components/ai-elements/response';
```

```tsx
<Response>**Hi there.** I am an AI model designed to help you.</Response>
```

### Usage with AI SDK

Populate a markdown response with messages from [`useChat`](/docs/reference/ai-sdk-ui/use-chat).

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

const ResponseDemo = () => {
  const { messages } = useChat();

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text': // we don't use any reasoning or tool calls in this example
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
    </div>
  );
};

export default ResponseDemo;
```

### Features

- Renders markdown content with support for paragraphs, links, and code blocks
- Supports GFM features like tables, task lists, and strikethrough text via remark-gfm
- Supports rendering Math Equations via rehype-katex
- **Smart streaming support** - automatically completes incomplete formatting during real-time text streaming
- Code blocks are rendered with syntax highlighting for various programming languages
- Code blocks include a button to easily copy code to clipboard
- Adapts to different screen sizes while maintaining readability
- Seamlessly integrates with both light and dark themes
- Customizable appearance through className props and Tailwind CSS utilities
- Built with accessibility in mind for all users

### Props

### `<Response />`

<PropertiesTable
  content={[
    {
      name: 'children',
      type: 'string',
      description: 'The markdown content to render.',
    },
    {
      name: 'parseIncompleteMarkdown',
      type: 'boolean',
      description: 'Whether to parse and fix incomplete markdown syntax (e.g., unclosed code blocks or lists).',
      default: 'true',
      isOptional: true,
    },
    {
      name: 'className',
      type: 'string',
      description: 'CSS class names to apply to the wrapper div element.',
      isOptional: true,
    },
    {
      name: 'components',
      type: 'object',
      description: 'Custom React components to use for rendering markdown elements (e.g., custom heading, paragraph, code block components).',
      isOptional: true,
    },
    {
      name: 'allowedImagePrefixes',
      type: 'string[]',
      description: 'Array of allowed URL prefixes for images. Use ["*"] to allow all images.',
      default: '["*"]',
      isOptional: true,
    },
    {
      name: 'allowedLinkPrefixes',
      type: 'string[]',
      description: 'Array of allowed URL prefixes for links. Use ["*"] to allow all links.',
      default: '["*"]',
      isOptional: true,
    },
    {
      name: 'defaultOrigin',
      type: 'string',
      description: 'Default origin to use for relative URLs in links and images.',
      isOptional: true,
    },
    {
      name: 'rehypePlugins',
      type: 'array',
      description: 'Array of rehype plugins to use for processing HTML. Includes KaTeX for math rendering by default.',
      default: '[rehypeKatex]',
      isOptional: true,
    },
    {
      name: 'remarkPlugins',
      type: 'array',
      description: 'Array of remark plugins to use for processing markdown. Includes GitHub Flavored Markdown and math support by default.',
      default: '[remarkGfm, remarkMath]',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>


# Sources

The `Sources` component allows a user to view the sources or citations used to generate a response.

<Preview path="sources" />

### Installation

```sh
npx ai-elements@latest add sources
```

### Usage

```tsx
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
```

```tsx
<Sources>
  <SourcesTrigger count={1} />
  <SourcesContent>
    <Source href="https://ai-sdk.dev" title="AI SDK" />
  </SourcesContent>
</Sources>
```

### Usage with AI SDK

Build a simple web search agent with Perplexity Sonar.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { useChat } from '@ai-sdk/react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { useState } from 'react';
import { DefaultChatTransport } from 'ai';

const SourceDemo = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/sources',
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto mb-4">
          <Conversation>
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'assistant' && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'source-url':
                            return (
                              <SourcesContent key={`${message.id}-${i}`}>
                                <Source
                                  key={`${message.id}-${i}`}
                                  href={part.url}
                                  title={part.url}
                                />
                              </SourcesContent>
                            );
                        }
                      })}
                    </Sources>
                  )}
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                </div>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Ask a question and search the..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default SourceDemo;
```

Add the following route to your backend:

```tsx filename="api/chat/route.ts"
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { perplexity } from '@ai-sdk/perplexity';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'perplexity/sonar',
    system:
      'You are a helpful assistant. Keep your responses short (< 100 words) unless you are asked for more details. ALWAYS USE SEARCH.',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
  });
}
```

### Features

- Collapsible component that allows a user to view the sources or citations used to generate a response
- Customizable trigger and content components
- Support for custom sources or citations
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes

## Examples

### Custom rendering

<Preview path="sources-custom" />

### Props

### `<Sources />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>

### `<SourcesTrigger />`

<PropertiesTable
  content={[
    {
      name: 'count',
      type: 'number',
      description: 'The number of sources to display in the trigger.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ButtonHTMLAttributes<HTMLButtonElement>',
      description: 'Any other props are spread to the trigger button.',
      isOptional: true,
    },
  ]}
/>

### `<SourcesContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the content container.',
      isOptional: true,
    },
  ]}
/>

### `<Source />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.AnchorHTMLAttributes<HTMLAnchorElement>',
      description: 'Any other props are spread to the anchor element.',
      isOptional: true,
    },
  ]}
/>


# Suggestion

The `Suggestion` component displays a horizontal row of clickable suggestions for user interaction.

<Preview path="suggestion" />

### Installation

```sh
npx ai-elements@latest add suggestion
```

### Usage

```tsx
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
```

```tsx
<Suggestions>
  <Suggestion suggestion="What are the latest trends in AI?" />
</Suggestions>
```

### Usage with AI SDK

Build a simple input with suggestions users can click to send a message to the LLM.

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

const suggestions = [
  'Can you explain how to play tennis?',
  'What is the weather in Tokyo?',
  'How do I make a really good fish taco?',
];

const SuggestionDemo = () => {
  const [input, setInput] = useState('');
  const { sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex flex-col gap-4">
          <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion}
                onClick={handleSuggestionClick}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>
          <Input
            onSubmit={handleSubmit}
            className="mt-4 w-full max-w-2xl mx-auto relative"
          >
            <PromptInputTextarea
              value={input}
              placeholder="Say something..."
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-12"
            />
            <PromptInputSubmit
              status={status === 'streaming' ? 'streaming' : 'ready'}
              disabled={!input.trim()}
              className="absolute bottom-1 right-1"
            />
          </Input>
        </div>
      </div>
    </div>
  );
};

export default SuggestionDemo;
```

### Features

- Horizontal row of clickable suggestion buttons
- Customizable styling with variant and size options
- Flexible layout that wraps suggestions on smaller screens
- onClick callback that emits the selected suggestion string
- Support for both individual suggestions and suggestion lists
- Clean, modern styling with hover effects
- Responsive design with mobile-friendly touch targets
- TypeScript support with proper type definitions

## Examples

#### Usage with AI Input

<Preview path="suggestion-input" />

### Props

### `<Suggestions />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof ScrollArea>',
      description:
        'Any other props are spread to the underlying ScrollArea component.',
      isOptional: true,
    },
  ]}
/>

### `<Suggestion />`

<PropertiesTable
  content={[
    {
      name: 'suggestion',
      type: 'string',
      description: 'The suggestion string to display and emit on click.',
      isOptional: false,
    },
    {
      name: 'onClick',
      type: '(suggestion: string) => void',
      description: 'Callback fired when the suggestion is clicked.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'Omit<React.ComponentProps<typeof Button>, "onClick">',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
      isOptional: true,
    },
  ]}
/>


# Task

The `Task` component provides a structured way to display task lists or workflow progress with collapsible details, status indicators, and progress tracking. It consists of a main `Task` container with `TaskTrigger` for the clickable header and `TaskContent` for the collapsible content area.

<Preview path="task" />

### Installation

```sh
npx ai-elements@latest add task
```

### Usage

```tsx
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from '@/components/ai-elements/task';
```

```tsx
<Task className="w-full">
  <TaskTrigger title="Found project files" />
  <TaskContent>
    <TaskItem>
      Read <TaskItemFile>index.md</TaskItemFile>
    </TaskItem>
  </TaskContent>
</Task>
```

### Usage with AI SDK

Build a mock async programming agent using [`experimental_generateObject`](/docs/reference/ai-sdk-ui/use-object).

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import {
  Task,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
  TaskContent,
} from '@/components/ai-elements/task';
import { Button } from '@/components/ui/button';
import { tasksSchema } from '@/app/api/task/route';
import {
  SiReact,
  SiTypescript,
  SiJavascript,
  SiCss,
  SiHtml5,
  SiJson,
  SiMarkdown,
} from '@icons-pack/react-simple-icons';

const iconMap = {
  react: { component: SiReact, color: '#149ECA' },
  typescript: { component: SiTypescript, color: '#3178C6' },
  javascript: { component: SiJavascript, color: '#F7DF1E' },
  css: { component: SiCss, color: '#1572B6' },
  html: { component: SiHtml5, color: '#E34F26' },
  json: { component: SiJson, color: '#000000' },
  markdown: { component: SiMarkdown, color: '#000000' },
};

const TaskDemo = () => {
  const { object, submit, isLoading } = useObject({
    api: '/api/agent',
    schema: tasksSchema,
  });

  const handleSubmit = (taskType: string) => {
    submit({ prompt: taskType });
  };

  const renderTaskItem = (item: any, index: number) => {
    if (item?.type === 'file' && item.file) {
      const iconInfo = iconMap[item.file.icon as keyof typeof iconMap];
      if (iconInfo) {
        const IconComponent = iconInfo.component;
        return (
          <span className="inline-flex items-center gap-1" key={index}>
            {item.text}
            <TaskItemFile>
              <IconComponent
                color={item.file.color || iconInfo.color}
                className="size-4"
              />
              <span>{item.file.name}</span>
            </TaskItemFile>
          </span>
        );
      }
    }
    return item?.text || '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            onClick={() => handleSubmit('React component development')}
            disabled={isLoading}
            variant="outline"
          >
            React Development
          </Button>
        </div>

        <div className="flex-1 overflow-auto space-y-4">
          {isLoading && !object && (
            <div className="text-muted-foreground">Generating tasks...</div>
          )}

          {object?.tasks?.map((task: any, taskIndex: number) => (
            <Task key={taskIndex} defaultOpen={taskIndex === 0}>
              <TaskTrigger title={task.title || 'Loading...'} />
              <TaskContent>
                {task.items?.map((item: any, itemIndex: number) => (
                  <TaskItem key={itemIndex}>
                    {renderTaskItem(item, itemIndex)}
                  </TaskItem>
                ))}
              </TaskContent>
            </Task>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskDemo;
```

Add the following route to your backend:

```ts filename="app/api/agent.ts"
import { streamObject } from 'ai';
import { z } from 'zod';

export const taskItemSchema = z.object({
  type: z.enum(['text', 'file']),
  text: z.string(),
  file: z
    .object({
      name: z.string(),
      icon: z.string(),
      color: z.string().optional(),
    })
    .optional(),
});

export const taskSchema = z.object({
  title: z.string(),
  items: z.array(taskItemSchema),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

export const tasksSchema = z.object({
  tasks: z.array(taskSchema),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: 'openai/gpt-4o',
    schema: tasksSchema,
    prompt: `You are an AI assistant that generates realistic development task workflows. Generate a set of tasks that would occur during ${prompt}.

    Each task should have:
    - A descriptive title
    - Multiple task items showing the progression
    - Some items should be plain text, others should reference files
    - Use realistic file names and appropriate file types
    - Status should progress from pending to in_progress to completed

    For file items, use these icon types: 'react', 'typescript', 'javascript', 'css', 'html', 'json', 'markdown'

    Generate 3-4 tasks total, with 4-6 items each.`,
  });

  return result.toTextStreamResponse();
}
```

### Features

- Visual icons for pending, in-progress, completed, and error states
- Expandable content for task descriptions and additional information
- Built-in progress counter showing completed vs total tasks
- Optional progressive reveal of tasks with customizable timing
- Support for custom content within task items
- Full type safety with proper TypeScript definitions
- Keyboard navigation and screen reader support

### Props

### `<Task />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Collapsible>',
      description:
        'Any other props are spread to the root Collapsible component.',
      isOptional: true,
    },
  ]}
/>

### `<TaskTrigger />`

<PropertiesTable
  content={[
    {
      name: 'title',
      type: 'string',
      description:
        'The title of the task that will be displayed in the trigger.',
      isOptional: false,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CollapsibleTrigger>',
      description:
        'Any other props are spread to the CollapsibleTrigger component.',
      isOptional: true,
    },
  ]}
/>

### `<TaskContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CollapsibleContent>',
      description:
        'Any other props are spread to the CollapsibleContent component.',
      isOptional: true,
    },
  ]}
/>

### `<TaskItem />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>

### `<TaskItemFile />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>


# Tool

The `Tool` component displays a collapsible interface for showing/hiding tool details. It is designed to take the `ToolUIPart` type from the AI SDK and display it in a collapsible interface.

<Preview path="tool" />

### Installation

```sh
npx ai-elements@latest add tool
```

### Usage

```tsx
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from '@/components/ai-elements/tool';
```

```tsx
<Tool>
  <ToolHeader type="tool-call" state={'output-available' as const} />
  <ToolContent>
    <ToolInput input="Input to tool call" />
    <ToolOutput errorText="Error" output="Output from tool call" />
  </ToolContent>
</Tool>
```

### Usage in AI SDK

Build a simple stateful weather app that renders the last message in a tool using [`useChat`](/docs/reference/ai-sdk-ui/use-chat).

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type ToolUIPart } from 'ai';
import { Button } from '@/components/ui/button';
import { Response } from '@/components/ai-elements/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';

type WeatherToolInput = {
  location: string;
  units: 'celsius' | 'fahrenheit';
};

type WeatherToolOutput = {
  location: string;
  temperature: string;
  conditions: string;
  humidity: string;
  windSpeed: string;
  lastUpdated: string;
};

type WeatherToolUIPart = ToolUIPart<{
  fetch_weather_data: {
    input: WeatherToolInput;
    output: WeatherToolOutput;
  };
}>;

const Example = () => {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/weather',
    }),
  });

  const handleWeatherClick = () => {
    sendMessage({ text: 'Get weather data for San Francisco in fahrenheit' });
  };

  const latestMessage = messages[messages.length - 1];
  const weatherTool = latestMessage?.parts?.find(
    (part) => part.type === 'tool-fetch_weather_data',
  ) as WeatherToolUIPart | undefined;

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="space-y-4">
          <Button onClick={handleWeatherClick} disabled={status !== 'ready'}>
            Get Weather for San Francisco
          </Button>

          {weatherTool && (
            <Tool defaultOpen={true}>
              <ToolHeader type="tool-fetch_weather_data" state={weatherTool.state} />
              <ToolContent>
                <ToolInput input={weatherTool.input} />
                <ToolOutput
                  output={
                    <Response>
                      {formatWeatherResult(weatherTool.output)}
                    </Response>
                  }
                  errorText={weatherTool.errorText}
                />
              </ToolContent>
            </Tool>
          )}
        </div>
      </div>
    </div>
  );
};

function formatWeatherResult(result: WeatherToolOutput): string {
  return `**Weather for ${result.location}**

**Temperature:** ${result.temperature}  
**Conditions:** ${result.conditions}  
**Humidity:** ${result.humidity}  
**Wind Speed:** ${result.windSpeed}  

*Last updated: ${result.lastUpdated}*`;
}

export default Example;
```

Add the following route to your backend:

```ts filename="app/api/weather/route.tsx"
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    messages: convertToModelMessages(messages),
    tools: {
      fetch_weather_data: {
        description: 'Fetch weather information for a specific location',
        parameters: z.object({
          location: z
            .string()
            .describe('The city or location to get weather for'),
          units: z
            .enum(['celsius', 'fahrenheit'])
            .default('celsius')
            .describe('Temperature units'),
        }),
        inputSchema: z.object({
          location: z.string(),
          units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
        }),
        execute: async ({ location, units }) => {
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const temp =
            units === 'celsius'
              ? Math.floor(Math.random() * 35) + 5
              : Math.floor(Math.random() * 63) + 41;

          return {
            location,
            temperature: `${temp}°${units === 'celsius' ? 'C' : 'F'}`,
            conditions: 'Sunny',
            humidity: `12%`,
            windSpeed: `35 ${units === 'celsius' ? 'km/h' : 'mph'}`,
            lastUpdated: new Date().toLocaleString(),
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Features

- Collapsible interface for showing/hiding tool details
- Visual status indicators with icons and badges
- Support for multiple tool execution states (pending, running, completed, error)
- Formatted parameter display with JSON syntax highlighting
- Result and error handling with appropriate styling
- Composable structure for flexible layouts
- Accessible keyboard navigation and screen reader support
- Consistent styling that matches your design system
- Auto-opens completed tools by default for better UX

## Examples

### Input Streaming (Pending)

Shows a tool in its initial state while parameters are being processed.

<Preview path="tool-input-streaming" />

### Input Available (Running)

Shows a tool that's actively executing with its parameters.

<Preview path="tool-input-available" />

### Output Available (Completed)

Shows a completed tool with successful results. Opens by default to show the results. In this instance, the output is a JSON object, so we can use the `CodeBlock` component to display it.

<Preview path="tool-output-available" />

### Output Error

Shows a tool that encountered an error during execution. Opens by default to display the error.

<Preview path="tool-output-error" />

### Props

### `<Tool />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Collapsible>',
      description:
        'Any other props are spread to the root Collapsible component.',
      isOptional: true,
    },
  ]}
/>

### `<ToolHeader />`

<PropertiesTable
  content={[
    {
      name: 'type',
      type: 'ToolUIPart["type"]',
      description: 'The type/name of the tool.',
      isOptional: false,
    },
    {
      name: 'state',
      type: 'ToolUIPart["state"]',
      description:
        'The current state of the tool (input-streaming, input-available, output-available, or output-error).',
      isOptional: false,
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes to apply to the header.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CollapsibleTrigger>',
      description: 'Any other props are spread to the CollapsibleTrigger.',
      isOptional: true,
    },
  ]}
/>

### `<ToolContent />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof CollapsibleContent>',
      description: 'Any other props are spread to the CollapsibleContent.',
      isOptional: true,
    },
  ]}
/>

### `<ToolInput />`

<PropertiesTable
  content={[
    {
      name: 'input',
      type: 'ToolUIPart["input"]',
      description:
        'The input parameters passed to the tool, displayed as formatted JSON.',
      isOptional: false,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>

### `<ToolOutput />`

<PropertiesTable
  content={[
    {
      name: 'output',
      type: 'React.ReactNode',
      description: 'The output/result of the tool execution.',
      isOptional: false,
    },
    {
      name: 'errorText',
      type: 'ToolUIPart["errorText"]',
      description: 'An error message if the tool execution failed.',
      isOptional: false,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<"div">',
      description: 'Any other props are spread to the underlying div.',
      isOptional: true,
    },
  ]}
/>


# WebPreview

The `WebPreview` component provides a flexible way to showcase the result of a generated UI component, along with its source code. It is designed for documentation and demo purposes, allowing users to interact with live examples and view the underlying implementation.

<Preview path="web-preview" />

### Installation

```sh
npx ai-elements@latest add web-preview
```

### Usage

```tsx
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from '@/components/ai-elements/web-preview';
```

```tsx
<WebPreview defaultUrl="https://ai-sdk.dev" style={{ height: '400px' }}>
  <WebPreviewNavigation>
    <WebPreviewUrl src="https://ai-sdk.dev" />
  </WebPreviewNavigation>
  <WebPreviewBody src="https://ai-sdk.dev" />
</WebPreview>
```

### Usage with AI SDK

Build a simple v0 clone using the [v0 Platform API](https://v0.dev/docs/api/platform).

Install the `v0-sdk` package:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn']}>
    <Tab>
      <Snippet text="pnpm add v0-sdk" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install v0-sdk" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add v0-sdk" dark />
    </Tab>
  </Tabs>
</div>

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from '@/components/ai-elements/web-preview';
import { useState } from 'react';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Loader } from '../ai-elements/loader';

const WebPreviewDemo = () => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setPrompt('');

    setIsGenerating(true);
    try {
      const response = await fetch('/api/v0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setPreviewUrl(data.demo || '/');
      console.log('Generation finished:', data);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex-1 mb-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader />
              <p className="mt-4 text-muted-foreground">
                Generating app, this may take a few seconds...
              </p>
            </div>
          ) : previewUrl ? (
            <WebPreview defaultUrl={previewUrl}>
              <WebPreviewNavigation>
                <WebPreviewUrl />
              </WebPreviewNavigation>
              <WebPreviewBody src={previewUrl} />
            </WebPreview>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Your generated app will appear here
            </div>
          )}
        </div>

        <Input
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={prompt}
            placeholder="Describe the app you want to build..."
            onChange={(e) => setPrompt(e.currentTarget.value)}
            className="pr-12 min-h-[60px]"
          />
          <PromptInputSubmit
            status={isGenerating ? 'streaming' : 'ready'}
            disabled={!prompt.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default WebPreviewDemo;
```

Add the following route to your backend:

```ts filename="app/api/v0/route.ts"
import { v0 } from 'v0-sdk';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = await v0.chats.create({
    system: 'You are an expert coder',
    message: prompt,
    modelConfiguration: {
      modelId: 'v0-1.5-sm',
      imageGenerations: false,
      thinking: false,
    },
  });

  return Response.json({
    demo: result.demo,
    webUrl: result.webUrl,
  });
}
```

### Features

- Live preview of UI components
- Composable architecture with dedicated sub-components
- Responsive design modes (Desktop, Tablet, Mobile)
- Navigation controls with back/forward functionality
- URL input and example selector
- Full screen mode support
- Console logging with timestamps
- Context-based state management
- Consistent styling with the design system
- Easy integration into documentation pages

### Props

### `<WebPreview />`

<PropertiesTable
  content={[
    {
      name: 'defaultUrl',
      type: 'string',
      description:
        'The initial URL to load in the preview (default: empty string).',
      isOptional: true,
    },
    {
      name: 'onUrlChange',
      type: '(url: string) => void',
      description: 'Callback fired when the URL changes.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>

### `<WebPreviewNavigation />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the navigation container.',
      isOptional: true,
    },
  ]}
/>

### `<WebPreviewNavigationButton />`

<PropertiesTable
  content={[
    {
      name: 'tooltip',
      type: 'string',
      description: 'Tooltip text to display on hover.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Button>',
      description:
        'Any other props are spread to the underlying shadcn/ui Button component.',
      isOptional: true,
    },
  ]}
/>

### `<WebPreviewUrl />`

<PropertiesTable
  content={[
    {
      name: '[...props]',
      type: 'React.ComponentProps<typeof Input>',
      description:
        'Any other props are spread to the underlying shadcn/ui Input component.',
      isOptional: true,
    },
  ]}
/>

### `<WebPreviewBody />`

<PropertiesTable
  content={[
    {
      name: 'loading',
      type: 'React.ReactNode',
      description: 'Optional loading indicator to display over the preview.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.IframeHTMLAttributes<HTMLIFrameElement>',
      description: 'Any other props are spread to the underlying iframe.',
      isOptional: true,
    },
  ]}
/>

### `<WebPreviewConsole />`

<PropertiesTable
  content={[
    {
      name: 'logs',
      type: 'Array<{ level: "log" | "warn" | "error"; message: string; timestamp: Date }>',
      description: 'Console log entries to display in the console panel.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'Any other props are spread to the root div.',
      isOptional: true,
    },
  ]}
/>
