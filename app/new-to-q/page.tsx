import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New to Q? — Hot and Fresh",
  description: "Everything you need to know to get started with Qnotables.",
}

export default function NewToQPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      {/* Page header */}
      <div className="mb-12 border-b border-border pb-8">
        <p className="label-mono mb-3 text-primary">GETTING STARTED</p>
        <h1 className="stencil text-4xl text-foreground md:text-5xl">New to Q?</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Welcome. This page will walk you through everything you need to know.
        </p>
      </div>

      {/* Content sections — add, edit, or remove these freely */}
      <div className="space-y-12">

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">What is Qnotables?</h2>
          <p className="leading-relaxed text-muted-foreground">
            Add your introduction here.
          </p>
        </section>

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">Where to Start</h2>
          <p className="leading-relaxed text-muted-foreground">
            Add your getting-started guide here.
          </p>
        </section>

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">Key Resources</h2>
          <p className="leading-relaxed text-muted-foreground">
            Add links and resources here.
          </p>
        </section>

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">Frequently Asked Questions</h2>
          <p className="leading-relaxed text-muted-foreground">
            Add FAQs here.
          </p>
        </section>

      </div>
    </main>
  )
}
