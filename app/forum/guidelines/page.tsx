import Link from "next/link"
import { ArrowLeft, Check, Flag, HeartHandshake, Quote, ShieldCheck } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({ title: "Community Guidelines", description: "Plain-language guidelines for participating in the QNotables Town Hall.", path: "/forum/guidelines" })

const principles = [
  ["Be respectful", "Disagree with ideas without diminishing the people behind them."],
  ["Stay on topic", "Keep replies connected to the question, source, or thread in front of you."],
  ["Cite sources when practical", "Links, examples, and clear context help others follow your reasoning."],
  ["Do not harass others", "Threats, targeted abuse, personal information, and dogpiling are not welcome."],
  ["Report problems", "Use the report control when something crosses a line instead of escalating in public."],
]

export default function GuidelinesPage() {
  return <div className="min-h-screen tactical-grid"><SiteHeader /><main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:px-6"><div><Link href="/forum" className="label-mono inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="size-3" /> Back to Town Hall</Link><div className="label-mono mt-8 text-xs text-primary">THE TOWN HALL / FIELD GUIDE</div><h1 className="stencil mt-2 text-4xl text-foreground md:text-5xl">A better conversation is a shared job.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">These guidelines keep the Town Hall useful for people who are curious, skeptical, informed, or still finding their footing.</p></div><div className="grid gap-4 md:grid-cols-2">{principles.map(([title, description]) => <Card key={title}><CardHeader><CardTitle className="flex items-center gap-3 text-lg"><Check className="size-5 text-primary" /> {title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}</div><Card className="border-primary/30 bg-primary/5"><CardHeader><CardTitle className="flex items-center gap-3"><HeartHandshake className="size-5 text-primary" /> Before you publish</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm leading-6 text-foreground md:grid-cols-3"><p><Quote className="mb-2 size-4 text-primary" />Lead with the question you want answered.</p><p><ShieldCheck className="mb-2 size-4 text-primary" />Separate what you know from what you suspect.</p><p><Flag className="mb-2 size-4 text-primary" />Report a concern privately when needed.</p></CardContent></Card><div className="flex flex-wrap gap-3"><Button asChild><Link href="/forum/new">Start a discussion</Link></Button><Button asChild variant="outline"><Link href="/forum">Browse discussions</Link></Button></div></main><SiteFooter /></div>
}
