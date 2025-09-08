'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, User, Download, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DocumentCardProps {
  document: any
}

export function DocumentCard({ document }: DocumentCardProps) {
  const getFileTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'doc':
      case 'docx':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'xls':
      case 'xlsx':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'ppt':
      case 'pptx':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {document.title || 'Untitled Document'}
              </CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {document.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {document.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-sm">
          {document.created_at && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(document.created_at), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {document.author && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{document.author}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {document.file_type && (
              <Badge variant="outline" className={getFileTypeColor(document.file_type)}>
                {document.file_type.toUpperCase()}
              </Badge>
            )}
            {document.document_type && (
              <Badge variant="secondary">
                {document.document_type}
              </Badge>
            )}
          </div>
          {document.file_size && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(document.file_size)}
            </span>
          )}
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}