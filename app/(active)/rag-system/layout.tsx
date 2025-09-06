// RAG System Layout Component

import { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  BarChart3,
  Upload,
  Settings,
} from "lucide-react";

export const metadata: Metadata = {
  title: "RAG System - Alleato AI",
  description: "Retrieval-Augmented Generation System",
};

export default function RagSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div>
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold">RAG System</h1>
              <nav className="flex space-x-6">
                <Link
                  href="/rag-system"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Link>
                <Link
                  href="/rag-system/documents"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </Link>
                <Link
                  href="/rag-system/chat"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </Link>
                <Link
                  href="/rag-system/stats"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Statistics</span>
                </Link>
              </nav>
            </div>
            <Link
              href="/rag-system/settings"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
