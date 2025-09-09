declare module 'common-tags' {
  export function stripIndent(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function stripIndents(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function oneLineInlineLists(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function oneLineTrim(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function inlineLists(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function commaListsOr(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function commaListsAnd(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function html(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function safeHtml(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function codeBlock(template: TemplateStringsArray, ...substitutions: any[]): string;
  export function source(template: TemplateStringsArray, ...substitutions: any[]): string;
}