"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the session first to avoid errors if not authenticated
        const { data: sessionData } = await supabase.auth.getSession()

        // Only try to get user if we have a session
        if (sessionData?.session) {
          const { data, error } = await supabase.auth.getUser()

          if (error) {
            setError(error.message)
          } else if (data?.user) {
            setUser(data.user)
          }
        } else {
          // No session, but this is expected on login/signup pages
        }
      } catch (error: unknown) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="ml-3 hidden md:block">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-32 bg-gray-200 rounded mt-1 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    // Just return null on error - no need to show error to user
    return null
  }

  if (!user) {
    // Return a simple placeholder for non-authenticated state
    return (
      <div className="flex items-center">
        <Avatar>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="ml-3 hidden md:block">
          <p className="text-sm font-medium text-gray-700">Guest</p>
          <p className="text-xs text-gray-500">Not signed in</p>
        </div>
      </div>
    )
  }

  // Get initials from email
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"

  return (
    <div className="flex items-center">
      <Avatar>
        <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || "User"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="ml-3 hidden md:block">
        <p className="text-sm font-medium text-gray-700">
          {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
        </p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
    </div>
  )
}
