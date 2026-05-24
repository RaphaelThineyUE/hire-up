import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeJobPosting } from '@/lib/scraper'

const JSONLD_HTML = `
<html><head>
<script type="application/ld+json">{
  "@type": "JobPosting",
  "title": "Senior Engineer",
  "hiringOrganization": { "name": "Acme Corp" },
  "jobLocation": { "address": { "addressLocality": "Paris", "addressCountry": "FR" } },
  "jobLocationType": "TELECOMMUTE",
  "employmentType": "FULL_TIME",
  "datePosted": "2026-05-20T00:00:00Z",
  "description": "We are looking for a Senior Engineer to join our team.",
  "baseSalary": { "currency": "EUR", "value": { "minValue": 80000, "maxValue": 110000 } }
}</script>
</head><body></body></html>
`

const HEURISTICS_HTML = `
<html>
<head><meta property="og:site_name" content="Startup Inc" /></head>
<body>
  <h1>Product Designer</h1>
  <main>Great role for a designer. Remote work available. Must be creative.</main>
</body>
</html>
`

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('scrapeJobPosting', () => {
  it('extracts all fields from JSON-LD JobPosting', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSONLD_HTML),
    } as Response)

    const result = await scrapeJobPosting('https://example.com/job/123')

    expect(result.role).toBe('Senior Engineer')
    expect(result.company).toBe('Acme Corp')
    expect(result.location).toBe('Paris, FR')
    expect(result.remote_type).toBe('remote')
    expect(result.contract_type).toBe('full-time')
    expect(result.posted_at).toBe('2026-05-20')
    expect(result.salary_range).toBe('EUR 80000–110000')
    expect(result.job_description).toContain('Senior Engineer')
    expect(result.confidence).toBe('high')
  })

  it('throws on non-ok HTTP response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response)
    await expect(scrapeJobPosting('https://example.com')).rejects.toThrow('fetch_error_403')
  })

  it('falls back to heuristics when no JSON-LD is present', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HEURISTICS_HTML),
    } as Response)

    const result = await scrapeJobPosting('https://example.com/job/456')

    expect(result.role).toBe('Product Designer')
    expect(result.company).toBe('Startup Inc')
    expect(result.remote_type).toBe('remote')
    expect(result.confidence).toBe('medium')
  })

  it('returns low confidence when heuristics find neither role nor company', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><body>Nothing useful</body></html>'),
    } as Response)

    const result = await scrapeJobPosting('https://example.com')
    expect(result.confidence).toBe('low')
  })

  it('extracts from JSON-LD @graph wrapper', async () => {
    const html = `<html><head><script type="application/ld+json">{
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "name": "Jobs Inc" },
      { "@type": "JobPosting", "title": "Staff Engineer", "hiringOrganization": { "name": "Graph Corp" } }
    ]
  }</script></head><body></body></html>`
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve(html) } as Response)
    const result = await scrapeJobPosting('https://example.com')
    expect(result.role).toBe('Staff Engineer')
    expect(result.company).toBe('Graph Corp')
    expect(result.confidence).toBe('high')
  })

  it('includes unitText from top-level baseSalary', async () => {
    const html = `<html><head><script type="application/ld+json">{
    "@type": "JobPosting",
    "title": "Engineer",
    "hiringOrganization": { "name": "Acme" },
    "baseSalary": { "currency": "USD", "unitText": "YEAR", "value": { "minValue": 80000, "maxValue": 120000 } }
  }</script></head><body></body></html>`
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve(html) } as Response)
    const result = await scrapeJobPosting('https://example.com')
    expect(result.salary_range).toBeDefined()
    expect(result.salary_range).toContain('80000')
    expect(result.salary_range?.toLowerCase()).toContain('year')
  })

  it('converts "Posted X days ago" to an ISO date', async () => {
    const html = `<html>
  <head><meta property="og:site_name" content="Job Board" /></head>
  <body><h1>Backend Dev</h1><p>Posted 3 days ago</p><main>Great job in a great team.</main></body>
  </html>`
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve(html) } as Response)
    const result = await scrapeJobPosting('https://example.com')
    expect(result.posted_at).toBeDefined()
    // Should be a valid YYYY-MM-DD string, 3 days before today
    const expected = new Date()
    expected.setDate(expected.getDate() - 3)
    expect(result.posted_at).toBe(expected.toISOString().split('T')[0])
  })
})
