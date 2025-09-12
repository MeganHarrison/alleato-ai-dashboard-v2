"use client";

import type { ReactElement } from "react";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Client-side refresh button for Notion projects page.
 * 
 * Uses React's useTransition for optimal refresh state management
 * and proper cleanup to prevent memory leaks.
 * 
 * @returns ReactElement
 */
export function RefreshButton(): ReactElement {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = (): void => {
    setIsRefreshing(true);
    
    startTransition(() => {
      try {
        router.refresh();
      } catch (error) {
        // Log error but don't throw to prevent breaking user experience
        console.error('Refresh failed:', error);
      }
    });

    // Reset state after a brief UI feedback period
    timeoutRef.current = setTimeout(() => {
      setIsRefreshing(false);
      timeoutRef.current = null;
    }, 1000);
  };

  const isLoading = isRefreshing || isPending;

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleRefresh}
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Refreshing..." : "Refresh"}
    </Button>
  );
}