import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.qnotables.ai/auth/login" },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
