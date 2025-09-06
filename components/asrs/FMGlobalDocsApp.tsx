"use client";

import type { ReactElement } from "react";
import { useState, useCallback, useMemo } from "react";
import { DocumentationSidebar } from "../docs/DocumentationSidebar";
import { DocumentationContent } from "../docs/DocumentationContent";
import { DocumentationSearch } from "../docs/DocumentationSearch";
import { DocumentationHeader } from "../docs/DocumentationHeader";
import type { Section, ContentBlock, SearchResult } from "../docs/types";

// Mock data - in production this would come from Supabase
const MOCK_SECTIONS: Section[] = [
  {
    id: "sec-1-0",
    number: "1.0",
    title: "SCOPE",
    slug: "scope",
    sortKey: 10,
    parentId: null,
    pageStart: 7,
    pageEnd: 8,
    sectionPath: ["1"],
    breadcrumbDisplay: ["FM Global 8-34", "Scope"],
    isVisible: true,
    sectionType: "section",
  },
  {
    id: "sec-1-1",
    number: "1.1",
    title: "Changes",
    slug: "changes",
    sortKey: 11,
    parentId: "sec-1-0",
    pageStart: 8,
    pageEnd: 9,
    sectionPath: ["1", "1"],
    breadcrumbDisplay: ["FM Global 8-34", "Scope", "Changes"],
    isVisible: true,
    sectionType: "section",
  },
  {
    id: "sec-2-0",
    number: "2.0",
    title: "LOSS PREVENTION RECOMMENDATIONS",
    slug: "loss-prevention",
    sortKey: 20,
    parentId: null,
    pageStart: 9,
    pageEnd: 12,
    sectionPath: ["2"],
    breadcrumbDisplay: ["FM Global 8-34", "Loss Prevention Recommendations"],
    isVisible: true,
    sectionType: "section",
  },
  {
    id: "sec-2-1",
    number: "2.1",
    title: "ASRS Types",
    slug: "asrs-types",
    sortKey: 21,
    parentId: "sec-2-0",
    pageStart: 9,
    pageEnd: 11,
    sectionPath: ["2", "1"],
    breadcrumbDisplay: [
      "FM Global 8-34",
      "Loss Prevention Recommendations",
      "ASRS Types",
    ],
    isVisible: true,
    sectionType: "section",
  },
  {
    id: "sec-2-1-1",
    number: "2.1.1",
    title: "Mini-Load ASRS",
    slug: "mini-load-asrs",
    sortKey: 211,
    parentId: "sec-2-1",
    pageStart: 9,
    pageEnd: 10,
    sectionPath: ["2", "1", "1"],
    breadcrumbDisplay: [
      "FM Global 8-34",
      "Loss Prevention Recommendations",
      "ASRS Types",
      "Mini-Load ASRS",
    ],
    isVisible: true,
    sectionType: "section",
  },
  {
    id: "sec-2-1-2",
    number: "2.1.2",
    title: "Shuttle ASRS",
    slug: "shuttle-asrs",
    sortKey: 212,
    parentId: "sec-2-1",
    pageStart: 10,
    pageEnd: 11,
    sectionPath: ["2", "1", "2"],
    breadcrumbDisplay: [
      "FM Global 8-34",
      "Loss Prevention Recommendations",
      "ASRS Types",
      "Shuttle ASRS",
    ],
    isVisible: true,
    sectionType: "section",
  },
  {
    id: "sec-3-0",
    number: "3.0",
    title: "PROTECTION REQUIREMENTS",
    slug: "protection-requirements",
    sortKey: 30,
    parentId: null,
    pageStart: 12,
    pageEnd: 45,
    sectionPath: ["3"],
    breadcrumbDisplay: ["FM Global 8-34", "Protection Requirements"],
    isVisible: true,
    sectionType: "section",
  },
];

const MOCK_CONTENT_BLOCKS: Record<string, ContentBlock[]> = {
  "sec-1-0": [
    {
      id: "block-1-0-1",
      sectionId: "sec-1-0",
      blockType: "paragraph",
      ordinal: 1,
      sourceText:
        "This data sheet provides guidance on the protection of automatic storage and retrieval systems (ASRS) with in-rack and ceiling sprinklers. The recommendations in this data sheet apply to the following ASRS types: mini-load, shuttle, top-loading, and vertically enclosed rack.",
      html: "<p>This data sheet provides guidance on the protection of automatic storage and retrieval systems (ASRS) with in-rack and ceiling sprinklers. The recommendations in this data sheet apply to the following ASRS types: mini-load, shuttle, top-loading, and vertically enclosed rack.</p>",
      pageReference: 7,
      inlineFigures: [],
      inlineTables: [],
      meta: {},
    },
    {
      id: "block-1-0-2",
      sectionId: "sec-1-0",
      blockType: "note",
      ordinal: 2,
      sourceText:
        "Note: This data sheet supersedes all previous versions and incorporates the latest research findings on ASRS protection.",
      html: '<div class="fm-note"><strong>Note:</strong> This data sheet supersedes all previous versions and incorporates the latest research findings on ASRS protection.</div>',
      pageReference: 7,
      inlineFigures: [],
      inlineTables: [],
      meta: {},
    },
  ],
  "sec-2-1-1": [
    {
      id: "block-2-1-1-1",
      sectionId: "sec-2-1-1",
      blockType: "paragraph",
      ordinal: 1,
      sourceText:
        "A mini-load ASRS is characterized by the use of angle irons to support containers. The container rests on the angle irons and is supported from below. Typical tier heights range from 9 to 18 inches (230 to 460 mm).",
      html: "<p>A mini-load ASRS is characterized by the use of angle irons to support containers. The container rests on the angle irons and is supported from below. Typical tier heights range from 9 to 18 inches (230 to 460 mm).</p>",
      pageReference: 9,
      inlineFigures: [1, 2],
      inlineTables: [],
      meta: {},
    },
    {
      id: "block-2-1-1-2",
      sectionId: "sec-2-1-1",
      blockType: "important",
      ordinal: 2,
      sourceText:
        "Important: The protection scheme for mini-load ASRS depends heavily on the container configuration and commodity classification. Open-top containers require significantly more protection.",
      html: '<div class="fm-important"><strong>Important:</strong> The protection scheme for mini-load ASRS depends heavily on the container configuration and commodity classification. Open-top containers require significantly more protection.</div>',
      pageReference: 9,
      inlineFigures: [],
      inlineTables: ["Table-27", "Table-32"],
      meta: {},
    },
  ],
};

export default function FMGlobalDocsApp(): ReactElement {
  const [currentSection, setCurrentSection] = useState<string>("sec-1-0");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const currentSectionData = useMemo(() => {
    return MOCK_SECTIONS.find((section) => section.id === currentSection);
  }, [currentSection]);

  const currentContentBlocks = useMemo(() => {
    return MOCK_CONTENT_BLOCKS[currentSection] || [];
  }, [currentSection]);

  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSection(sectionId);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);

    // Mock search implementation
    // In production, this would call the Supabase search function
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock search results
      const mockResults: SearchResult[] = [
        {
          sectionId: "sec-2-1-1",
          sectionTitle: "Mini-Load ASRS",
          sectionSlug: "mini-load-asrs",
          blockContent:
            "A mini-load ASRS is characterized by the use of angle irons to support containers...",
          pageReference: 9,
          rank: 0.95,
        },
        {
          sectionId: "sec-2-1-2",
          sectionTitle: "Shuttle ASRS",
          sectionSlug: "shuttle-asrs",
          blockContent:
            "Shuttle ASRS systems use slats or mesh shelving without vertical guides...",
          pageReference: 10,
          rank: 0.87,
        },
      ];

      // Filter based on query (simple mock implementation)
      const filteredResults = mockResults.filter(
        (result) =>
          result.sectionTitle.toLowerCase().includes(query.toLowerCase()) ||
          result.blockContent.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    setCurrentSection(result.sectionId);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DocumentationSidebar
        sections={MOCK_SECTIONS}
        currentSectionId={currentSection}
        onSectionSelect={handleSectionChange}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-80"
        }`}
      >
        {/* Header */}
        <DocumentationHeader
          currentSection={currentSectionData}
          onMenuToggle={toggleSidebar}
        />

        {/* Search */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <DocumentationSearch
            onSearch={handleSearch}
            results={searchResults}
            isSearching={isSearching}
            onResultClick={handleSearchResultClick}
            query={searchQuery}
            onQueryChange={setSearchQuery}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <DocumentationContent
            section={currentSectionData}
            blocks={currentContentBlocks}
            allSections={MOCK_SECTIONS}
          />
        </div>
      </div>
    </div>
  );
}
