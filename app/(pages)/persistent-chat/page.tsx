'use client';

interface Citation {
  number: string;
  url: string;
  title?: string;
  description?: string;
  quote?: string;
}

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
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
import { useState } from 'react';
import { useChat } from 'ai/react';
import { Response } from '@/components/ai-elements/response';
import { GlobeIcon, RefreshCcwIcon, CopyIcon, FileTextIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { Actions, Action } from '@/components/ai-elements/actions';
import {
  InlineCitation,
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
import { citationSchema } from '@/app/api/citation/route';

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [generateCitations, setGenerateCitations] = useState(false);
  const { messages, append, isLoading, reload } = useChat();
  
  // Temporarily remove citation object functionality
  const citationObject: { content?: string; citations?: any[] } | null = null;
  const submitCitation = () => {};
  const citationLoading = false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      if (generateCitations && !webSearch) {
        // Use structured citation generation
        // submitCitation({ prompt: input }); // Temporarily disabled
        // Add a local message to show the request
        append(
          { role: 'user', content: input },
          {
            body: {
              model: model,
              webSearch: false,
            },
          },
        );
      } else {
        // Regular chat or web search
        append(
          { role: 'user', content: input },
          {
            body: {
              model: model,
              webSearch: webSearch,
            },
          },
        );
      }
      setInput('');
    }
  };

  // Function to render citation content
  const renderCitationContent = (content: string, citations: Citation[]) => {
    return content.split(/(\[\d+\])/).map((part, index) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const citationNumber = citationMatch[1];
        const citation = citations?.find(
          (c: Citation) => c.number === citationNumber,
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
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        {/* @ts-ignore - Conversation component type issue */}
        <Conversation className="h-full">
          {/* @ts-ignore - ConversationContent component type issue */}
          <ConversationContent>
            {messages.map((message, messageIndex) => (
              <div key={message.id}>
                {message.role === 'assistant' && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        ((message as any).parts?.filter(
                          (part: any) => part.type === 'source-url',
                        ) || []).length
                      }
                    />
                    {((message as any).parts?.filter((part: any) => part.type === 'source-url') || []).map((part: any, i: number) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {((message as any).parts || [{ type: 'text', text: message.content }]).map((part: any, i: number) => {
                      const isLastMessage = messageIndex === messages.length - 1;
                      
                      switch (part.type) {
                        case 'text':
                          return (
                            <div key={`${message.id}-${i}`}>
                              <Response>
                                {/* Check if this is the last message and we have citation data */}
                                {isLastMessage && citationObject && generateCitations ? (
                                  renderCitationContent(
                                    (citationObject as any)?.content || "", 
                                    (citationObject as any)?.citations || []
                                  )
                                ) : (
                                  part.text
                                )}
                              </Response>
                              {message.role === 'assistant' && isLastMessage && (
                                <Actions className="mt-2">
                                  <Action
                                    onClick={() => reload()}
                                    label="Retry"
                                  >
                                    <RefreshCcwIcon className="size-3" />
                                  </Action>
                                  <Action
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        (citationObject as any)?.content || part.text || ""
                                      )
                                    }
                                    label="Copy"
                                  >
                                    <CopyIcon className="size-3" />
                                  </Action>
                                </Actions>
                              )}
                            </div>
                          );
                        case 'reasoning':
                          return (
                            <div key={`${message.id}-${i}`}>
                              <Reasoning
                                className="w-full"
                                isStreaming={status === 'streaming'}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                              {message.role === 'assistant' && isLastMessage && (
                                <Actions className="mt-2">
                                  <Action
                                    onClick={() => reload()}
                                    label="Retry"
                                  >
                                    <RefreshCcwIcon className="size-3" />
                                  </Action>
                                  <Action
                                    onClick={() =>
                                      navigator.clipboard.writeText(part.text)
                                    }
                                    label="Copy reasoning"
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
              </div>
            ))}
            {(status === 'submitted' || citationLoading) && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => {
                  setWebSearch(!webSearch);
                  if (!webSearch) setGenerateCitations(false);
                }}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputButton
                variant={generateCitations ? 'default' : 'ghost'}
                onClick={() => {
                  setGenerateCitations(!generateCitations);
                  if (!generateCitations) setWebSearch(false);
                }}
                disabled={webSearch}
              >
                <FileTextIcon size={16} />
                <span>Citations</span>
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
                    <PromptInputModelSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;