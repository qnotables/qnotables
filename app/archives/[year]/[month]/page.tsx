import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/archive'

export const revalidate = 3600 // 1 hour

interface Props {
  params: Promise<{
    year: string
    month: string
  }>
}

export async function generateMetadata({ params }: Props) {
  const { year, month } = await params
  return {
    title: `${year} - ${getMonthName(parseInt(month))} | HOT AND FRESH Archives`,
    description: `Archive posts from ${getMonthName(parseInt(month))} ${year}`,
  }
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[month - 1] || ''
}

export default async function ArchiveMonthPage({ params }: Props) {
  const { year, month } = await params
  
  const yearNum = parseInt(year)
  const monthNum = parseInt(month)

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    notFound()
  }

  const supabase = await createClient()

  // Get posts for this month
  const startDate = new Date(yearNum, monthNum - 1, 1).toISOString()
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59).toISOString()

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at, category, featured, priority')
    .eq('status', 'published')
    .gte('published_at', startDate)
    .lte('published_at', endDate)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    notFound()
  }

  const monthPosts = posts || []

  if (monthPosts.length === 0) {
    notFound()
  }

  const monthName = getMonthName(monthNum)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-8 sm:px-8">
        <Link
          href="/archives"
          className="flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to archives
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {monthName} {year}
          </h1>
        </div>

        <p className="text-muted-foreground">
          {monthPosts.length} post{monthPosts.length !== 1 ? 's' : ''} archived
        </p>
      </div>

      {/* Posts Grid */}
      <div className="px-6 py-12 sm:px-8">
        <div className="max-w-4xl mx-auto grid gap-6">
          {monthPosts.map((post) => (
            <Link
              key={post.id}
              href={`/archives/${post.slug}`}
              className="group block border border-border p-6 hover:border-primary/50 hover:bg-muted/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {post.published_at && (
                      <span>{formatDate(post.published_at)}</span>
                    )}
                    {post.category && (
                      <span className="px-2 py-1 bg-muted border border-border/50">
                        {post.category}
                      </span>
                    )}
                    {post.featured && (
                      <span className="text-primary font-semibold">Featured</span>
                    )}
                  </div>
                </div>

                {post.priority > 0 && (
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/20 border border-primary/50 rounded-full text-primary font-bold text-sm">
                    {post.priority}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
