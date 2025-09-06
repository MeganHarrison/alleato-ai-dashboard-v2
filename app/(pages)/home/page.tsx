import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  const services = [
    {
      title: "BUSINESS EXPERT",
      description:
        "Think of me as your right-hand strategist, research assistant, and business brain extension, all in one.",
      href: "/chat",
    },
    {
      title: "DOCUMENTATION EXPERT",
      description: "AI Agent trained on all the systems you use within your business.",
      href: "/documentation-agent",
    },
    {
      title: "CONTENT LAB",
      description: "Create and update content with your AI agent workflows.",
      href: "/content",
    },
    {
      title: "COPYWRITER AGENT",
      description: "AI Agent trained on all of your business documents.",
      href: "/documents",
    },
    {
      title: "DATABASES",
      description: "AI Agent trained on all the systems you use within your business.",
      href: "/products",
    },
    {
      title: "YOUTUBE ANALYZER",
      description: "Create and update content with your AI agent workflows.",
      href: "/youtube",
    },
    {
      title: "DESIGN FLOW",
      description: "AI Agent trained on all of your business documents.",
      href: "/design",
    },
    {
      title: "LEAD GENERATOR",
      description: "AI Agent trained on all of your business documents.",
      href: "/leads",
    },
    {
      title: "RPM DASHBOARD",
      description: "Create and update content with your AI agent workflows.",
      href: "/dashboard",
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-[80px] font-didot text-[#333333] mb-16">hello.</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Link href={service.href} key={index} className="block transition-transform hover:-translate-y-1">
            <Card className="h-full transition-all duration-300 hover:shadow-[14px_27px_45px_8px_rgba(0,0,0,0.07)]">
              <CardContent className="p-6">
                <h3 className="text-[#44403C] font-sans text-xs font-bold tracking-[2px] leading-6 uppercase mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <footer className="mt-20 text-right text-xs text-gray-400">
        © 2025 Next Level AI Agents. All Rights Reserved.
      </footer>
    </div>
  )
}
