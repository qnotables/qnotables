import Papa from 'papaparse'
import matter from 'gray-matter'
import { parseISO, isValid } from 'date-fns'

export interface ImportedPost {
  title: string
  slug?: string
  excerpt?: string
  body: string
  category?: string
  tags?: string[]
  post_type?: string
  status?: 'draft' | 'published' | 'scheduled'
  featured?: boolean
  priority?: number
  published_at?: Date | null
  original_created_at?: Date | null
  source_url?: string
  source_name?: string
  original_source_url?: string
  cover_image_url?: string
  author_name?: string
}

// Parse various date formats
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null

  // Try ISO format first
  try {
    const isoDate = parseISO(dateString)
    if (isValid(isoDate)) return isoDate
  } catch {}

  // Try MM/DD/YYYY
  const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateString)
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (isValid(date)) return date
  }

  // Try YYYY-MM-DD
  const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateString)
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (isValid(date)) return date
  }

  return null
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 100)
}

// Parse CSV data
export async function parseCSV(csvText: string): Promise<ImportedPost[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const posts = results.data
            .filter((row: any) => row.title && row.title.trim())
            .map((row: any) => ({
              title: row.title?.trim(),
              slug: row.slug?.trim() || generateSlug(row.title),
              excerpt: row.excerpt?.trim(),
              body: row.body?.trim() || '',
              category: row.category?.trim(),
              tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
              post_type: row.post_type?.trim(),
              status: ['draft', 'published', 'scheduled'].includes(row.status?.toLowerCase()) 
                ? row.status.toLowerCase() 
                : 'draft',
              featured: row.featured === 'true' || row.featured === '1',
              priority: row.priority ? parseInt(row.priority) : 0,
              published_at: parseDate(row.published_at),
              original_created_at: parseDate(row.original_created_at),
              source_url: row.source_url?.trim(),
              source_name: row.source_name?.trim(),
              original_source_url: row.original_source_url?.trim(),
              cover_image_url: row.cover_image_url?.trim(),
              author_name: row.author_name?.trim(),
            }))

          resolve(posts)
        } catch (error) {
          reject(error)
        }
      },
      error: (error: Error) => reject(error),
    })
  })
}

// Parse JSON data
export async function parseJSON(jsonText: string): Promise<ImportedPost[]> {
  try {
    const data = JSON.parse(jsonText)
    const items = Array.isArray(data) ? data : [data]

    return items.map((item: any) => ({
      title: item.title || '',
      slug: item.slug || generateSlug(item.title),
      excerpt: item.excerpt,
      body: item.body || item.content || '',
      category: item.category,
      tags: Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
          ? item.tags.split(',').map((t: string) => t.trim())
          : [],
      post_type: item.post_type || item.type,
      status: ['draft', 'published', 'scheduled'].includes(item.status?.toLowerCase())
        ? item.status.toLowerCase()
        : 'draft',
      featured: item.featured === true || item.featured === 'true',
      priority: item.priority ? parseInt(item.priority) : 0,
      published_at: parseDate(item.published_at || item.publishedAt),
      original_created_at: parseDate(item.original_created_at || item.originalCreatedAt),
      source_url: item.source_url || item.sourceUrl,
      source_name: item.source_name || item.sourceName,
      original_source_url: item.original_source_url || item.originalSourceUrl,
      cover_image_url: item.cover_image_url || item.coverImageUrl,
      author_name: item.author_name || item.authorName,
    }))
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Parse Markdown with frontmatter
export async function parseMarkdown(markdownText: string): Promise<ImportedPost[]> {
  try {
    const posts: ImportedPost[] = []
    const sections = markdownText.split(/^---\n/m).filter(Boolean)

    for (let i = 0; i < sections.length; i += 2) {
          let frontmatter: Record<string, string> = {}
          let content = ''

          if (i + 1 < sections.length) {
            // Has frontmatter
            try {
              frontmatter = JSON.parse(sections[i])
            } catch {
              // Try YAML-like parsing as fallback
              const lines = sections[i].split('\n')
              for (const line of lines) {
                const [key, ...value] = line.split(':')
                if (key) {
                  frontmatter[key.trim()] = value.join(':').trim()
                }
              }
            }
        content = sections[i + 1]
      } else {
        // No frontmatter, just content
        content = sections[i]
      }

      const fm = frontmatter as any
      if (fm.title) {
        posts.push({
          title: fm.title,
          slug: fm.slug || generateSlug(fm.title),
          excerpt: fm.excerpt,
          body: content.trim(),
          category: fm.category,
          tags: typeof fm.tags === 'string'
            ? fm.tags.split(',').map((t: string) => t.trim())
            : Array.isArray(fm.tags)
              ? fm.tags
              : [],
          post_type: fm.post_type || fm.type,
          status: ['draft', 'published', 'scheduled'].includes(fm.status?.toLowerCase())
            ? fm.status.toLowerCase()
            : 'draft',
          featured: fm.featured === true || fm.featured === 'true',
          priority: fm.priority ? parseInt(fm.priority) : 0,
          published_at: parseDate(fm.published_at || fm.publishedAt),
          original_created_at: parseDate(fm.original_created_at || fm.originalCreatedAt),
          source_url: fm.source_url || fm.sourceUrl,
          source_name: fm.source_name || fm.sourceName,
          original_source_url: fm.original_source_url || fm.originalSourceUrl,
          cover_image_url: fm.cover_image_url || fm.coverImageUrl,
          author_name: fm.author_name || fm.authorName,
        })
      }
    }

    return posts
  } catch (error) {
    throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Parse RSS/XML feed (using simple XML parsing)
export async function parseRSSFeed(xmlText: string): Promise<ImportedPost[]> {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'application/xml')

    if (doc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Failed to parse XML')
    }

    const posts: ImportedPost[] = []
    const items = doc.querySelectorAll('item')
    const feedTitle = doc.querySelector('channel > title')?.textContent || 'RSS Import'

    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || ''
      const description = item.querySelector('description')?.textContent || ''
      const link = item.querySelector('link')?.textContent || ''
      const pubDate = item.querySelector('pubDate')?.textContent || ''
      const category = item.querySelector('category')?.textContent || ''
      const author = item.querySelector('author')?.textContent || ''

      if (title) {
        posts.push({
          title,
          slug: generateSlug(title),
          excerpt: description.slice(0, 300),
          body: description,
          category,
          tags: [],
          post_type: 'RSS Import',
          status: 'draft',
          featured: false,
          priority: 0,
          published_at: parseDate(pubDate),
          source_url: link,
          source_name: feedTitle,
          author_name: author,
        })
      }
    })

    return posts
  } catch (error) {
    throw new Error(`Failed to parse RSS: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Validate posts before import
export function validatePosts(posts: ImportedPost[]): { valid: ImportedPost[]; errors: Array<{ index: number; error: string }> } {
  const valid: ImportedPost[] = []
  const errors: Array<{ index: number; error: string }> = []

  posts.forEach((post, index) => {
    const postErrors: string[] = []

    if (!post.title || post.title.trim().length < 3) {
      postErrors.push('Title must be at least 3 characters')
    }

    if (!post.slug) {
      postErrors.push('Slug is required')
    }

    if (!post.body || post.body.trim().length < 10) {
      postErrors.push('Body must be at least 10 characters')
    }

    if (post.status === 'published' && !post.published_at) {
      postErrors.push('Published posts must have a published_at date')
    }

    if (postErrors.length > 0) {
      errors.push({ index, error: postErrors.join('; ') })
    } else {
      valid.push(post)
    }
  })

  return { valid, errors }
}
