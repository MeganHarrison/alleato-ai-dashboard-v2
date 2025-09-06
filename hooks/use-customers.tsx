"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Customer {
  id: number
  full_name: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  country?: string
  state?: string
  products_services?: string
  social_media?: string
  photo_url?: string
  created_at: string
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Sample data to use when the table doesn't exist
  const sampleData = [
    {
      id: 1,
      full_name: "Acme Corporation",
      industry: "Technology",
      website: "https://acme.example.com",
      email: "contact@acme.example.com",
      phone: "123-456-7890",
      country: "United States",
      state: "California",
      products_services: "Cloud Services, Security",
      social_media: "twitter.com/acme, linkedin.com/acme",
      photo_url: "/air-conditioner-unit.png",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      full_name: "Globex Industries",
      industry: "Manufacturing",
      website: "https://globex.example.com",
      email: "info@globex.example.com",
      phone: "098-765-4321",
      country: "Germany",
      state: "Bavaria",
      products_services: "Industrial Equipment, Consulting",
      social_media: "twitter.com/globex, linkedin.com/globex",
      photo_url: "/giant-insect.png",
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      full_name: "Stark Enterprises",
      industry: "Energy",
      website: "https://stark.example.com",
      email: "hello@stark.example.com",
      phone: "555-555-5555",
      country: "United States",
      state: "New York",
      products_services: "Clean Energy, R&D",
      social_media: "twitter.com/stark, linkedin.com/stark",
      photo_url: "/stylized-letter-se.png",
      created_at: new Date().toISOString(),
    },
  ]

  // Define columns based on the specific fields requested
  const columns = [
    {
      key: "photo_url",
      label: "Photo",
      format: (value: string) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
          {value ? (
            <img
              src={value.startsWith("http") ? value : "/placeholder.svg?height=40&width=40&query=User"}
              alt="Customer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/abstract-geometric-shapes.png"
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">?</div>
          )}
        </div>
      ),
    },
    {
      key: "full_name",
      label: "Name",
    },
    {
      key: "industry",
      label: "Industry",
    },
    {
      key: "website",
      label: "Website",
      format: (value: string) =>
        value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {value.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "email",
      label: "Email",
      format: (value: string) =>
        value ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "country",
      label: "Country",
    },
    {
      key: "state",
      label: "State",
    },
    {
      key: "products_services",
      label: "Products/Services",
    },
    {
      key: "social_media",
      label: "Social Media",
      format: (value: string) => {
        if (!value) return "-"

        // Split by comma and create links
        return (
          <div className="flex flex-wrap gap-2">
            {value.split(",").map((social, index) => {
              const trimmed = social.trim()
              // Extract domain for display
              const domain = trimmed.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]

              return (
                <a
                  key={index}
                  href={trimmed.startsWith("http") ? trimmed : `https://${trimmed}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {domain}
                </a>
              )
            })}
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setIsLoading(true)
        const supabase = createClientComponentClient()

        // Select only the specific columns we need
        const { data, error: supabaseError } = await supabase
          .from("customers")
          .select(
            "id, full_name, industry, website, email, phone, country, state, products_services, social_media, photo_url, created_at",
          )
          .order("full_name", { ascending: true })

        if (supabaseError) {
          // Check if the error is because the table doesn't exist
          if (supabaseError.message.includes("does not exist")) {
            console.log("Table doesn't exist, using sample data")
            setTableExists(false)
            setCustomers(sampleData)
            throw new Error("The 'customers' table does not exist in your Supabase database")
          }
          throw supabaseError
        }

        setCustomers(data || [])
      } catch (e) {
        console.error("Error fetching customers:", e)
        setError(e as Error)

        // Always set sample data when there's an error
        setCustomers(sampleData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  return { customers, error, tableExists, isLoading, columns }
}
