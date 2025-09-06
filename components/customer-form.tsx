"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addCustomer } from "@/app/actions/customer-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomerFormProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomerForm({ isOpen, onClose }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await addCustomer(formData)

      if (!result.success) {
        setError(result.error)
        return
      }

      // Success
      toast({
        title: "Customer added",
        description: "The customer has been added successfully",
      })

      onClose()
      router.refresh()
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Add New Customer</ModalTitle>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                required
                className="h-10 bg-white border-gray-200 focus-visible:ring-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="h-10 bg-white border-gray-200 focus-visible:ring-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm">
                Company
              </Label>
              <Input
                id="company"
                name="company"
                className="h-10 bg-white border-gray-200 focus-visible:ring-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm">
                Website
              </Label>
              <Input
                id="website"
                name="website"
                className="h-10 bg-white border-gray-200 focus-visible:ring-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">
                Phone
              </Label>
              <Input id="phone" name="phone" className="h-10 bg-white border-gray-200 focus-visible:ring-black/20" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm">
                Gender
              </Label>
              <Select name="gender">
                <SelectTrigger className="h-10 bg-white border-gray-200 focus-visible:ring-black/20">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday" className="text-sm">
                Birthday
              </Label>
              <Input
                id="birthday"
                name="birthday"
                type="date"
                className="h-10 bg-white border-gray-200 focus-visible:ring-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm">
                Country
              </Label>
              <Input
                id="country"
                name="country"
                className="h-10 bg-white border-gray-200 focus-visible:ring-black/20"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose} size="sm" className="h-9">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} size="sm" className="h-9">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Customer"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
