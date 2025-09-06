"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm",
  {
    variants: {
      position: {
        default: "items-center",
        top: "items-start pt-10",
      },
    },
    defaultVariants: {
      position: "default",
    },
  },
)

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof modalVariants> {
  isOpen: boolean
  onClose: () => void
  position?: "default" | "top"
}

export function Modal({ className, children, isOpen, onClose, position, ...props }: ModalProps) {
  const [isClosing, setIsClosing] = React.useState(false)

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 150)
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(modalVariants({ position }), isClosing ? "animate-out fade-out" : "animate-in fade-in", className)}
      onClick={handleClose}
      {...props}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg border border-gray-100",
          isClosing ? "animate-out zoom-out-95" : "animate-in zoom-in-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-8 w-8 p-0" onClick={handleClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        {children}
      </div>
    </div>
  )
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({ className, ...props }: ModalHeaderProps) {
  return <div className={cn("mb-4", className)} {...props} />
}

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function ModalTitle({ className, ...props }: ModalTitleProps) {
  return <h3 className={cn("text-lg font-medium tracking-tight", className)} {...props} />
}

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function ModalDescription({ className, ...props }: ModalDescriptionProps) {
  return <p className={cn("text-sm text-gray-500", className)} {...props} />
}

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalBody({ className, ...props }: ModalBodyProps) {
  return <div className={cn("py-2", className)} {...props} />
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return <div className={cn("mt-6 flex items-center justify-end space-x-2", className)} {...props} />
}
