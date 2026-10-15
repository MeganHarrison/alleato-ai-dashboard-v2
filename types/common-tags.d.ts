declare module 'common-tags' {
  export function stripIndent(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function stripIndents(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function oneLineInlineLists(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function oneLineTrim(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function inlineLists(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function commaListsOr(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function commaListsAnd(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function html(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function safeHtml(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function codeBlock(template: TemplateStringsArray, ...substitutions: unknown[]): string;
  export function source(template: TemplateStringsArray, ...substitutions: unknown[]): string;
}