import Link from "next/link"
import { LayoutDashboard, UserPlus, Activity, Bell, TrendingUp, ChevronRight } from "lucide-react"

const features = [
  {
    title: "Real-time Monitoring",
    description: "Monitor HTTP/HTTPS endpoints with customizable check intervals. Stay on top of your services 24/7.",
    href: "/dashboard",
    label: "Go to Dashboard",
    icon: Activity,
    iconBg: "bg-blue-500",
  },
  {
    title: "Instant Alerts",
    description: "Get notified via email or mobile app when your services go down. Never miss an outage again.",
    href: "/dashboard",
    label: "Set up alerts",
    icon: Bell,
    iconBg: "bg-sky-400",
  },
  {
    title: "Analytics & History",
    description: "Track uptime percentages and response times over time. Clear insights at a glance.",
    href: "/dashboard",
    label: "View analytics",
    icon: TrendingUp,
    iconBg: "bg-rose-500",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-14 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            Uptime Monitor
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto">
            Open-source uptime monitoring and status pages
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" strokeWidth={2.5} />
              Open Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.5} />
              Create Account
            </Link>
          </div>
        </div>

        {/* Feature cards - 2 cols on sm, 3 on md (third spans full width on sm) */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const isThird = i === 2
            return (
              <div
                key={feature.title}
                className={`bg-white rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow ${isThird ? "sm:col-span-2 md:col-span-1" : ""}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1 text-blue-700 font-medium text-sm hover:text-blue-700 transition-colors"
                >
                  {feature.label}
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
