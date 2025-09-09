"use client";

import { ReactNode } from "react";

interface TableLayoutWrapperProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function TableLayoutWrapper({ children, fullWidth = false }: TableLayoutWrapperProps) {
  return (
    <div className={`space-y-4 p-2 sm:p-4 md:p-6 ${fullWidth ? 'w-full' : 'w-[95%] sm:w-full'} mx-auto`}>
      {children}
    </div>
  );
}