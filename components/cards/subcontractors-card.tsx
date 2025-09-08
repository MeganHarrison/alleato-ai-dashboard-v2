'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Building, Wrench, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SubcontractorCardProps {
  subcontractor: any
}

export function SubcontractorCard({ subcontractor }: SubcontractorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'inactive':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {subcontractor.company_name || 'Unnamed Subcontractor'}
            </CardTitle>
            {(subcontractor.contact_first_name || subcontractor.contact_last_name) && (
              <p className="text-sm text-muted-foreground mt-1">
                {[subcontractor.contact_first_name, subcontractor.contact_last_name].filter(Boolean).join(' ')}
              </p>
            )}
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
                View Details
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
        <div className="space-y-2">
          {subcontractor.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${subcontractor.email}`} className="text-blue-600 hover:underline truncate">
                {subcontractor.email}
              </a>
            </div>
          )}
          
          {subcontractor.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`tel:${subcontractor.phone}`} className="text-blue-600 hover:underline">
                {subcontractor.phone}
              </a>
            </div>
          )}

          {subcontractor.trade && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{subcontractor.trade}</span>
            </div>
          )}
        </div>

        {subcontractor.specialties && subcontractor.specialties.length > 0 && (
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {subcontractor.specialties.slice(0, 3).map((specialty: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {subcontractor.specialties.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{subcontractor.specialties.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {subcontractor.status && (
            <Badge variant="outline" className={getStatusColor(subcontractor.status)}>
              {subcontractor.status}
            </Badge>
          )}
          {subcontractor.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-muted-foreground">{subcontractor.rating}/5</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}