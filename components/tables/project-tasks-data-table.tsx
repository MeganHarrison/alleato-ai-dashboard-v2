'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  Filter,
  Download,
  Columns3,
  ChevronDown,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/types/database.types'
import Link from 'next/link'

type ProjectTask = Database["public"]["Tables"]["project_tasks"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectTaskWithProject extends ProjectTask {
  project?: Project | null
}

interface ProjectTasksDataTableProps {
  tasks: ProjectTaskWithProject[]
}

const columns = [
  { id: 'task_description', label: 'Task Description', defaultVisible: true },
  { id: 'project', label: 'Project', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'priority', label: 'Priority', defaultVisible: true },
  { id: 'assigned_to', label: 'Assigned To', defaultVisible: true },
  { id: 'due_date', label: 'Due Date', defaultVisible: true },
  { id: 'created_at', label: 'Created', defaultVisible: false },
  { id: 'updated_at', label: 'Updated', defaultVisible: false },
]

function getStatusColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getPriorityColor(priority: string | null) {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—'
  try {
    return format(new Date(dateString), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '—'
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  } catch {
    return '—'
  }
}

export function ProjectTasksDataTable({ tasks }: ProjectTasksDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(col => col.defaultVisible).map(col => col.id))
  )

  // Get unique filter values
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(tasks.map(task => task.status).filter((status): status is string => Boolean(status))))
    return ['all', ...statuses]
  }, [tasks])

  const uniquePriorities = useMemo(() => {
    const priorities = Array.from(new Set(tasks.map(task => task.priority).filter((priority): priority is string => Boolean(priority))))
    return ['all', ...priorities]
  }, [tasks])

  const uniqueAssignees = useMemo(() => {
    const assignees = Array.from(new Set(tasks.map(task => task.assigned_to).filter((assignee): assignee is string => Boolean(assignee))))
    return ['all', ...assignees]
  }, [tasks])

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      
      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      
      // Assigned to filter
      if (assignedToFilter !== 'all' && task.assigned_to !== assignedToFilter) return false

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          task.task_description?.toLowerCase().includes(query) ||
          task.project?.name?.toLowerCase().includes(query) ||
          task.assigned_to?.toLowerCase().includes(query) ||
          task.status?.toLowerCase().includes(query) ||
          task.priority?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, assignedToFilter])

  const toggleColumn = (columnId: string) => {
    const newVisible = new Set(visibleColumns)
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId)
    } else {
      newVisible.add(columnId)
    }
    setVisibleColumns(newVisible)
  }

  return (
    <div className="space-y-6 p-2 sm:p-6 w-[95%] sm:w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage and track project tasks across all projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'All Status' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {uniquePriorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority === 'all' ? 'All Priority' : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              {uniqueAssignees.map(assignee => (
                <SelectItem key={assignee} value={assignee}>
                  {assignee === 'all' ? 'All Assignees' : assignee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="h-4 w-4 mr-2" />
              Columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.has(column.id)}
                onCheckedChange={() => toggleColumn(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {visibleColumns.has('task_description') && (
                <TableHead className="font-semibold">Task Description</TableHead>
              )}
              {visibleColumns.has('project') && (
                <TableHead className="font-semibold">Project</TableHead>
              )}
              {visibleColumns.has('status') && (
                <TableHead className="font-semibold">Status</TableHead>
              )}
              {visibleColumns.has('priority') && (
                <TableHead className="font-semibold">Priority</TableHead>
              )}
              {visibleColumns.has('assigned_to') && (
                <TableHead className="font-semibold">Assigned To</TableHead>
              )}
              {visibleColumns.has('due_date') && (
                <TableHead className="font-semibold">Due Date</TableHead>
              )}
              {visibleColumns.has('created_at') && (
                <TableHead className="font-semibold">Created</TableHead>
              )}
              {visibleColumns.has('updated_at') && (
                <TableHead className="font-semibold">Updated</TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.size + 1} 
                  className="text-center py-12 text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Briefcase className="h-8 w-8 text-gray-300" />
                    <p>No tasks found matching your criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-gray-50">
                  {visibleColumns.has('task_description') && (
                    <TableCell className="font-medium max-w-md">
                      <div className="truncate" title={task.task_description}>
                        {task.task_description}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('project') && (
                    <TableCell>
                      {task.project ? (
                        <Link 
                          href={`/projects/${task.project.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <Building className="h-3.5 w-3.5" />
                          {task.project.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('status') && (
                    <TableCell>
                      <Badge className={cn('text-xs', getStatusColor(task.status))}>
                        {task.status || 'Not Set'}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.has('priority') && (
                    <TableCell>
                      <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                        {task.priority || 'Not Set'}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.has('assigned_to') && (
                    <TableCell>
                      {task.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>{task.assigned_to}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('due_date') && (
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('created_at') && (
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(task.created_at)}
                    </TableCell>
                  )}
                  {visibleColumns.has('updated_at') && (
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(task.updated_at)}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="flex flex-col">
                          <Button variant="ghost" size="sm" className="justify-start">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm" className="justify-start">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Task
                          </Button>
                          <Button variant="ghost" size="sm" className="justify-start text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Task
                          </Button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}