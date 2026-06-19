import Link from "next/link"
import { Archive, Rss, Search, Shield, FileText, Users, Clock, LinkIcon, Mail } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PillarCard } from "@/components/about/pillar-card"
import { ResearchStep } from "@/components/about/research-step"
import { DeskCard } from "@/components/about/desk-card"

export const metadata = {
  title: "About | HOT AND FRESH",
  description:
    "HOT AND FRESH is an independent research and media archive built to organize public information, source links, field notes, timelines, documents, videos, and story threads for review.",
  openGraph: {
    title: "About HOT AND FRESH",
    description:
      "An independent research platform organizing public information, sources, and developing stories into a searchable public record.",
    type: "website",
  },
}

export default function AboutPage() {
  const pillars = [
    {
      title: "Archive the Record",
      description: "Preserve source links, documents, media, field notes, timelines, and public records for later review.",
      icon: <Archive className="h-6 w-6" aria-hidden="true" />,
    },
    {
      title: "Track the Signal",
      description: "Organize developing stories across categories, sources, dates, tags, and research threads.",
      icon: <Search className="h-6 w-6" aria-hidden="true" />,
    },
    {
      title: "Verify Before Amplifying",
      description: "Encourage disciplined review, source checking, correction, and separation of fact, inference, and opinion.",
      icon: <Shield className="h-6 w-6" aria-hidden="true" />,
    },
    {
      title: "Build Public Memory",
      description: "Create a searchable archive that helps readers follow stories over time instead of relying on scattered fragments.",
      icon: <Clock className="h-6 w-6" aria-hidden="true" />,
    },
    {
      title: "Support Independent Research",
      description: "Give researchers, writers, contributors, and readers a place to organize leads, notes, links, and evidence.",
      icon: <FileText className="h-6 w-6" aria-hidden="true" />,
    },
    {
      title: "Distribute the Feed",
      description: "Use RSS, archives, blog posts, and public pages to make organized information easier to follow and share.",
      icon: <Rss className="h-6 w-6" aria-hidden="true" />,
    },
  ]

  const values = [
    "Discipline",
    "Verification",
    "Accountability",
    "Source preservation",
    "Public record",
    "Transparency",
    "Courage with restraint",
    "Correction without ego",
    "Free inquiry",
    "Responsible discussion",
  ]

  const steps = [
    {
      number: 1,
      title: "Find",
      description: "Collect public information, source links, records, posts, reports, documents, and media.",
    },
    {
      number: 2,
      title: "Verify",
      description: "Check dates, sources, context, original links, and supporting records where available.",
    },
    {
      number: 3,
      title: "Organize",
      description: "Sort material by category, tag, date, source, post type, media type, and timeline.",
    },
    {
      number: 4,
      title: "Archive",
      description: "Preserve the item in a searchable public record.",
    },
    {
      number: 5,
      title: "Review",
      description: "Allow readers and contributors to revisit, compare, correct, and follow developments over time.",
    },
  ]

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
            <h1 className="stencil text-5xl md:text-6xl text-foreground text-balance">
              About HOT AND FRESH
            </h1>
            <p className="label-mono mt-4 text-lg text-primary">
              Fresh drops. Hot leads. Organized for the record.
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              HOT AND FRESH is an independent research, media, and archive platform built to organize public information, source links, field notes, research threads, media clips, documents, and ongoing storylines into a searchable public record.
            </p>

            {/* Hero Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/archives"
                className="label-mono border border-primary bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Explore Archives →
              </Link>
              <Link
                href="/archives"
                className="label-mono border border-border bg-background px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Read Field Notes →
              </Link>
              <Link
                href="/forum"
                className="label-mono border border-border bg-background px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Join The Forum →
              </Link>
              <a
                href="/feed.xml"
                className="label-mono border border-border bg-background px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Follow The Feed →
              </a>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground">Mission</h2>
            <div className="mt-8 space-y-6 max-w-3xl">
              <p className="text-sm leading-relaxed text-muted-foreground">
                HOT AND FRESH exists to preserve the record, organize public information, and help readers track important stories through source links, field notes, archives, timelines, media, and disciplined research.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Our mission is not to tell people what to think. Our mission is to organize the material clearly enough that readers can review it, compare sources, follow developments, and make informed judgments for themselves.
              </p>
            </div>
          </div>
        </div>

        {/* Why This Exists */}
        <div className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground">Why This Exists</h2>
            <div className="mt-8 space-y-6 max-w-3xl">
              <p className="text-sm leading-relaxed text-muted-foreground">
                The modern information environment moves fast. Headlines disappear, sources change, posts get buried, and major stories are often scattered across platforms. HOT AND FRESH was built to slow that process down and organize the record.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This platform brings together archive posts, research threads, field notes, source records, videos, documents, forum discussions, and RSS distribution so important information can be reviewed over time instead of lost in the daily noise.
              </p>
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground mb-8">What We Do</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar) => (
                <PillarCard
                  key={pillar.title}
                  title={pillar.title}
                  description={pillar.description}
                  icon={pillar.icon}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground mb-8">Operating Values</h2>
            <div className="max-w-3xl space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {values.map((value) => (
                  <div key={value} className="border border-border bg-background p-3">
                    <p className="label-mono text-xs font-semibold text-primary">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground mt-6">
                Information is only useful when it is handled responsibly. HOT AND FRESH values strong research, clear sourcing, disciplined language, and the willingness to correct the record when needed.
              </p>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground mb-8">Important Note</h2>
            <div className="max-w-3xl space-y-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Items preserved or discussed on this site are not automatic endorsements. A post may be a source record, lead, public claim, news item, field note, research thread, or discussion point. Readers should verify source material, compare reports, and distinguish documented facts from interpretation or opinion.
              </p>
              <div className="border-l-4 border-primary bg-primary/5 p-4">
                <p className="stencil text-lg text-primary">==NOTABLES ARE NOT ENDORSEMENTS==.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How We Work */}
        <div className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground mb-8">How We Work</h2>
            <div className="max-w-3xl space-y-8">
              {steps.map((step) => (
                <ResearchStep key={step.number} number={step.number} title={step.title} description={step.description} />
              ))}
            </div>
          </div>
        </div>

        {/* The Desk */}
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground mb-8">The Desk</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <DeskCard
                title="Archives"
                href="/archives"
                icon={<Archive className="h-6 w-6" aria-hidden="true" />}
                description="Browse preserved records and research threads"
              />
              <DeskCard
                title="Field Notes"
                href="/archives"
                icon={<FileText className="h-6 w-6" aria-hidden="true" />}
                description="Organized notes and blog posts"
              />
              <DeskCard
                title="Forum"
                href="/forum"
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                description="Join community discussions"
              />
              <DeskCard
                title="Team"
                href="/team"
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                description="Meet the research desk"
              />
              <DeskCard
                title="Shop"
                href="https://shop.qnotables.ai"
                icon={<LinkIcon className="h-6 w-6" aria-hidden="true" />}
                description="Support the mission"
              />
              <DeskCard
                title="RSS Feed"
                href="/feed.xml"
                icon={<Rss className="h-6 w-6" aria-hidden="true" />}
                description="Subscribe to updates"
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <h2 className="stencil text-3xl md:text-4xl text-foreground mb-8">Contact The Desk</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground mb-8">
              For corrections, source submissions, media questions, or general contact, use the contact options provided by the site.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:contact@hotandfresh.news"
                className="label-mono border border-primary bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Contact
              </a>
              <Link
                href="/team"
                className="label-mono border border-border bg-background px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Team
              </Link>
              <Link
                href="/forum"
                className="label-mono border border-border bg-background px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Forum
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
