"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Database } from "@/types/database.types"

type Client = Database["public"]["Tables"]["clients"]["Row"]
type Company = Database["public"]["Tables"]["companies"]["Row"]

interface ClientWithCompany extends Client {
  company?: Company | null
}

interface ClientDetailsSheetProps {
  client: ClientWithCompany
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ClientDetailsSheet({ client, trigger, open, onOpenChange }: ClientDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side="right" className="flex flex-col w-[400px] sm:w-[540px]">
        <SheetHeader className="gap-1">
          <SheetTitle>{client.name || "Unnamed Client"}</SheetTitle>
          <SheetDescription>
            Client ID: #{client.id}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="space-y-4">
            {/* Client Overview */}
            <div>
              <h3 className="font-semibold mb-2">Client Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{client.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{client.status || "Active"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(client.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Information */}
            {client.company && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Company Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span>{client.company.name}</span>
                    </div>
                    {client.company.website && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Website:</span>
                        <a 
                          href={client.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {client.company.website}
                        </a>
                      </div>
                    )}
                    {client.company.city && client.company.state && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{client.company.city}, {client.company.state}</span>
                      </div>
                    )}
                    {client.company.address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="text-right max-w-[200px]">{client.company.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Edit Form */}
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="name">Client Name</Label>
                <Input id="name" defaultValue={client.name || ""} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={client.status || "active"}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="company">Company</Label>
                <Select defaultValue={client.company_id || ""}>
                  <SelectTrigger id="company" className="w-full">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {client.company && (
                      <SelectItem value={client.company.id}>
                        {client.company.name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
        </div>
        <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full">Save Changes</Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}