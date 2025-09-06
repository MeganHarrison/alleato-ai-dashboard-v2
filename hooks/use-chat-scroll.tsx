import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle auto-scrolling in chat interfaces
 * Automatically scrolls to bottom when new messages arrive
 */
export function useChatScroll<T>(dependency: T): React.MutableRefObject<HTMLDivElement | null> {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      const isScrolledNearBottom = 
        scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isScrolledNearBottom) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [dependency]);

  return scrollRef;
}