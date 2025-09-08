declare module "ai-elements" {
  import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

  export interface ConversationProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }

  export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
    role: "user" | "assistant" | "system";
    children?: ReactNode;
  }

  export interface ResponseProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }

  export interface PromptInputProps extends InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
  }

  export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
  }

  export interface ToolProps extends HTMLAttributes<HTMLDivElement> {
    name: string;
    state?: "call" | "result" | "error";
    children?: ReactNode;
  }

  export interface ReasoningProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }

  export interface SourcesProps extends HTMLAttributes<HTMLDivElement> {
    sources?: Array<{
      title: string;
      url?: string;
      description?: string;
    }>;
  }

  export interface ActionsProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }

  export interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
    language?: string;
    code: string;
    showLineNumbers?: boolean;
  }

  export interface TaskProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    status?: "pending" | "running" | "completed" | "failed";
    children?: ReactNode;
  }

  export interface BranchProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }

  export interface SuggestionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
  }

  export interface InlineCitationProps extends HTMLAttributes<HTMLSpanElement> {
    index?: number;
    children?: ReactNode;
  }

  export interface ImageProps extends HTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
  }

  export interface WebPreviewProps extends HTMLAttributes<HTMLDivElement> {
    url: string;
    title?: string;
    description?: string;
  }

  export const Conversation: React.FC<ConversationProps>;
  export const Message: React.FC<MessageProps>;
  export const Response: React.FC<ResponseProps>;
  export const PromptInput: React.FC<PromptInputProps>;
  export const Loader: React.FC<LoaderProps>;
  export const Tool: React.FC<ToolProps>;
  export const Reasoning: React.FC<ReasoningProps>;
  export const Sources: React.FC<SourcesProps>;
  export const Actions: React.FC<ActionsProps>;
  export const CodeBlock: React.FC<CodeBlockProps>;
  export const Task: React.FC<TaskProps>;
  export const Branch: React.FC<BranchProps>;
  export const Suggestion: React.FC<SuggestionProps>;
  export const InlineCitation: React.FC<InlineCitationProps>;
  export const Image: React.FC<ImageProps>;
  export const WebPreview: React.FC<WebPreviewProps>;
}