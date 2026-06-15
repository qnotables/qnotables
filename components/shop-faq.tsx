"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    question: "What's the difference between Command and Intel memberships?",
    answer:
      "Command gives you ad-free reading, priority FLASH alerts, and a 90-day archive. Intel adds unlimited archive access, Wire API access, source grading controls, and advanced filtering for analysts who need deeper insights.",
  },
  {
    question: "Can I cancel my membership anytime?",
    answer:
      "Yes. You can cancel your subscription at any time and retain access through the end of the billing period. No questions asked.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We currently ship to the US, Canada, and most European countries. Shipping costs vary by location. Please check the cart for your specific address during checkout.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Most merch ships in 3-5 business days. You'll receive a tracking number via email once your order ships. International orders may take 2-3 weeks depending on customs.",
  },
  {
    question: "What if I have issues with my merch?",
    answer:
      "We stand behind every product. If there's an issue, contact support@hotandfresh.news within 30 days of receipt and we'll make it right — replacement or refund.",
  },
]

export function ShopFAQ() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <section className="border-b border-border px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="stencil mb-4 text-3xl md:text-4xl text-foreground">Frequently Asked</h2>
          <p className="text-lg text-muted-foreground">
            Questions about memberships, orders, and shipping.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="border border-border">
              <button
                type="button"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="flex w-full items-center justify-between gap-4 bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                    expanded === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expanded === idx && (
                <div className="bg-background p-4 text-muted-foreground">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
