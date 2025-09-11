"use client"

import { useState } from "react"
import { updateProjectField } from "@/app/actions/project-actions"
import { formatDate } from "@/utils/format"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface EditableProjectsTableProps {
  projects: unknown[]
}

export function EditableProjectsTable({ projects }: EditableProjectsTableProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [tempValue, setTempValue] = useState<string>("")

  const handleCellClick = (rowId: string, field: string, value: unknown) => {
    if (field === "created_at") return // Don't allow editing created_at
    setEditingCell({ rowId, field })
    setTempValue(value || "")
  }

  const handleSave = async (rowId: string, field: string) => {
    try {
      await updateProjectField(rowId, field, tempValue || null)
      setEditingCell(null)
    } catch (error) {
      console.error("Failed to update:", error)
    }
  }

  const handleCancel = () => {
    setEditingCell(null)
    setTempValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === "Enter") {
      handleSave(rowId, field)
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      planning: "bg-brand-100 text-brand-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      on_hold: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const formatStatus = (status: string) => {
    if (!status) return "—"
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const renderEditableCell = (project: unknown, field: string, value: unknown) => {
    const isEditing = editingCell?.rowId === project.id && editingCell?.field === field

    if (field === "status") {
      if (isEditing) {
        return (
          <Select
            value={tempValue}
            onValueChange={(val) => {
              setTempValue(val)
              handleSave(project.id, field)
            }}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )
      }
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${getStatusClass(value)}`}
          onClick={() => handleCellClick(project.id, field, value)}
        >
          {formatStatus(value)}
        </span>
      )
    }

    if (field === "start_date" || field === "end_date") {
      if (isEditing) {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-32 justify-start text-left font-normal",
                  !tempValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tempValue ? format(new Date(tempValue), "MMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={tempValue ? new Date(tempValue) : undefined}
                onSelect={(date) => {
                  const isoDate = date ? date.toISOString().split('T')[0] : ""
                  setTempValue(isoDate)
                  handleSave(project.id, field)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      }
      return (
        <span
          className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
          onClick={() => handleCellClick(project.id, field, value)}
        >
          {value ? formatDate(value) : "—"}
        </span>
      )
    }

    if (field === "created_at") {
      return <span>{value ? formatDate(value) : "—"}</span>
    }

    if (isEditing) {
      return (
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, project.id, field)}
          onBlur={() => handleSave(project.id, field)}
          className="h-8"
          autoFocus
        />
      )
    }

    return (
      <span
        className="cursor-pointer hover:bg-muted px-2 py-1 rounded inline-block min-w-[50px]"
        onClick={() => handleCellClick(project.id, field, value)}
      >
        {value || "—"}
      </span>
    )
  }

  return (
    <div className="rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Project Name</th>
            <th className="text-left p-3 font-medium">Description</th>
            <th className="text-left p-3 font-medium">Client</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Start Date</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b hover:bg-muted/20">
              <td className="p-3">{renderEditableCell(project, "name", project.name)}</td>
              <td className="p-3">
                <div className="max-w-xs">
                  {renderEditableCell(project, "description", project.description)}
                </div>
              </td>
              <td className="p-3">{renderEditableCell(project, "client", project.client)}</td>
              <td className="p-3">{renderEditableCell(project, "status", project.status)}</td>
              <td className="p-3">{renderEditableCell(project, "start_date", project.start_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}