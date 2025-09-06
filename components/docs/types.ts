export interface Section {
  id: string;
  number: string;
  title: string;
  slug: string;
  sortKey: number;
  parentId: string | null;
  pageStart: number;
  pageEnd: number;
  sectionPath: string[];
  breadcrumbDisplay: string[];
  isVisible: boolean;
  sectionType: 'section' | 'figure' | 'table' | 'appendix';
}

export interface ContentBlock {
  id: string;
  sectionId: string;
  blockType: 'paragraph' | 'list_item' | 'table' | 'equation' | 'note' | 'warning' | 'important' | 'reference' | 'caption';
  ordinal: number;
  sourceText: string;
  html: string;
  pageReference: number | null;
  inlineFigures: number[];
  inlineTables: string[];
  meta: Record<string, any>;
}

export interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  sectionSlug: string;
  blockContent: string;
  pageReference: number;
  rank: number;
}

export interface Figure {
  id: string;
  figureNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  sectionReferences: string[];
}

export interface Table {
  id: string;
  tableId: string;
  title: string;
  description: string;
  sectionReferences: string[];
  data: Record<string, any>;
}