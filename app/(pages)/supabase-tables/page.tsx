"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import SupabaseManagerDialog from "@/components/supabase-manager";

export default function Example() {
  const [open, setOpen] = useState(false);
  const projectRef = "lgveqfnpkxvzbnnwuled"; // Replace with your actual project ref
  const isMobile = useIsMobile();

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Supabase Manager</Button>
      <SupabaseManagerDialog
        projectRef={projectRef}
        open={open}
        onOpenChange={setOpen}
        isMobile={isMobile}
      />
    </>
  );
}
