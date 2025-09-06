"use server"

import { revalidatePath } from "next/cache"

interface Meeting {
  id: string
  title: string
  date: string
  participants: string[]
  summary: string | null
  action_items: string[]
  project_id: string | null
  created_at: string
  updated_at: string
  projects?: {
    id: string
    name: string
  } | null
}

export async function getMeetingsFromD1() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/d1?action=list`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { meetings: [], error: errorData.error || 'Failed to fetch meetings' }
    }

    const data = await response.json()
    return { meetings: data.meetings || [], error: null }
  } catch (error) {
    console.error("Error fetching meetings from D1:", error)
    return { meetings: [], error: error instanceof Error ? error.message : 'Failed to fetch meetings' }
  }
}

export async function createMeetingInD1(meeting: Partial<Meeting>) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/d1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        data: meeting
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData.error || 'Failed to create meeting' }
    }

    const result = await response.json()
    revalidatePath("/meetings-d1")
    return { data: result.data, error: null }
  } catch (error) {
    console.error("Error creating meeting in D1:", error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create meeting' }
  }
}

export async function updateMeetingInD1(id: string, updates: Partial<Meeting>) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/d1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        data: { ...updates, id }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData.error || 'Failed to update meeting' }
    }

    const result = await response.json()
    revalidatePath("/meetings-d1")
    return { data: result.data, error: null }
  } catch (error) {
    console.error("Error updating meeting in D1:", error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update meeting' }
  }
}

export async function deleteMeetingFromD1(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/d1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        data: { id }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || 'Failed to delete meeting' }
    }

    revalidatePath("/meetings-d1")
    return { error: null }
  } catch (error) {
    console.error("Error deleting meeting from D1:", error)
    return { error: error instanceof Error ? error.message : 'Failed to delete meeting' }
  }
}