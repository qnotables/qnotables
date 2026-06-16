import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

// Verify cron secret for secure calls
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    // Verify request authenticity
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // Find posts that are scheduled and should be published
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, scheduled_at, status')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }

    const posts = scheduledPosts || []
    const publishedCount = posts.length

    if (publishedCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts to publish',
        publishedCount: 0,
      })
    }

    // Publish all scheduled posts
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_at: now,
      })
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)

    if (updateError) {
      console.error('Error publishing posts:', updateError)
      return NextResponse.json(
        { error: 'Failed to publish posts' },
        { status: 500 }
      )
    }

    // Revalidate cache for affected routes
    const slugs = posts.map((p: any) => p.slug)
    const revalidatePaths = [
      '/archives',
      ...slugs.map((slug: string) => `/archives/${slug}`),
    ]

    // Log the publication event
    console.log(`Published ${publishedCount} scheduled posts:`, slugs)

    return NextResponse.json({
      success: true,
      message: `Published ${publishedCount} scheduled posts`,
      publishedCount,
      posts: posts.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
      })),
      revalidatePaths,
    })
  } catch (error) {
    console.error('Scheduled publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Allow both GET and POST for flexibility in cron setup
  return GET(request)
}
