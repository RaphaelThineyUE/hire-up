import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { RemoteType, ContractType } from './types'

export interface ScrapeResult {
  company?: string
  role?: string
  location?: string
  salary_range?: string
  remote_type?: RemoteType
  contract_type?: ContractType
  posted_at?: string
  job_description?: string
  url: string
  confidence: 'high' | 'medium' | 'low'
}

const MAX_DESCRIPTION_LENGTH = 5000

export async function scrapeJobPosting(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HireUp/1.0; +https://hireup.app)' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`fetch_error_${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  // Walk every JSON-LD script and look for a JobPosting (possibly nested under @graph).
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    try {
      const raw = JSON.parse($(el).html() ?? '')
      const job = findJobPosting(raw)
      if (job) return parseJsonLd(job, url)
    } catch {
      // malformed JSON-LD — continue to next script tag
    }
  }

  return parseHeuristics($, url)
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
interface JsonObject {
  [key: string]: JsonValue
}
type JsonArray = JsonValue[]

function findJobPosting(node: JsonValue): JsonObject | null {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findJobPosting(child)
      if (found) return found
    }
    return null
  }
  if (typeof node === 'object') {
    const obj = node as JsonObject
    const typeVal = obj['@type']
    if (typeVal === 'JobPosting' || (Array.isArray(typeVal) && typeVal.includes('JobPosting'))) {
      return obj
    }
    if (obj['@graph']) {
      const found = findJobPosting(obj['@graph'])
      if (found) return found
    }
    if (obj['mainEntity']) {
      const found = findJobPosting(obj['mainEntity'])
      if (found) return found
    }
  }
  return null
}

function asString(v: JsonValue): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return undefined
}

function asObject(v: JsonValue): JsonObject | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as JsonObject) : undefined
}

function parseJsonLd(job: JsonObject, url: string): ScrapeResult {
  const result: ScrapeResult = { url, confidence: 'high' }

  result.role = asString(job.title)

  // hiringOrganization can be a string or { name }
  const org = job.hiringOrganization
  if (typeof org === 'string') {
    result.company = org.trim() || undefined
  } else {
    const orgObj = asObject(org ?? null)
    if (orgObj) result.company = asString(orgObj.name)
  }

  // jobLocation: object or array of objects
  result.location = parseJsonLdLocation(job.jobLocation)

  // jobLocationType
  result.remote_type = mapJobLocationType(asString(job.jobLocationType))

  // employmentType
  result.contract_type = mapEmploymentType(job.employmentType)

  // datePosted, with validThrough as fallback
  const posted = asString(job.datePosted) ?? asString(job.validThrough)
  if (posted) {
    const iso = isoDateOnly(posted)
    if (iso) result.posted_at = iso
  }

  // description (strip basic HTML)
  const desc = asString(job.description)
  if (desc) {
    const stripped = stripHtml(desc).trim()
    if (stripped) result.job_description = truncate(stripped, MAX_DESCRIPTION_LENGTH)
  }

  // baseSalary
  result.salary_range = parseJsonLdSalary(job.baseSalary)

  // Strip keys with null or undefined values so optional fields are truly absent.
  for (const key of Object.keys(result) as (keyof ScrapeResult)[]) {
    if (result[key] == null) delete result[key]
  }

  return result
}

function parseJsonLdLocation(loc: JsonValue): string | undefined {
  if (!loc) return undefined
  if (Array.isArray(loc)) {
    const parts = loc
      .map((entry) => parseJsonLdLocation(entry))
      .filter((s): s is string => Boolean(s))
    return parts.length > 0 ? parts.join(' / ') : undefined
  }
  const obj = asObject(loc)
  if (!obj) return undefined

  const addr = asObject(obj.address) ?? obj
  const city = asString(addr.addressLocality)
  const region = asString(addr.addressRegion)
  const country = asString(addr.addressCountry)
  const parts = [city, region, country].filter((s): s is string => Boolean(s))
  if (parts.length > 0) return parts.join(', ')

  return asString(obj.name)
}

function mapJobLocationType(v: string | undefined): RemoteType | undefined {
  if (!v) return undefined
  const norm = v.toUpperCase()
  if (norm.includes('TELECOMMUTE') || norm === 'REMOTE') return 'remote'
  if (norm.includes('HYBRID')) return 'hybrid'
  if (norm.includes('AT_LOCATION') || norm === 'ONSITE' || norm === 'ON_SITE') return 'onsite'
  return undefined
}

function mapEmploymentType(v: JsonValue): ContractType | undefined {
  if (!v) return undefined
  const values = Array.isArray(v) ? v : [v]
  for (const entry of values) {
    const s = asString(entry)
    if (!s) continue
    const norm = s.toUpperCase().replace(/[\s_-]/g, '')
    if (norm.includes('FULLTIME')) return 'full-time'
    if (norm.includes('PARTTIME')) return 'part-time'
    if (norm.includes('CONTRACT') || norm.includes('CONTRACTOR') || norm.includes('FREELANCE')) {
      return 'contract'
    }
    if (norm.includes('INTERN')) return 'internship'
  }
  return undefined
}

function parseJsonLdSalary(salary: JsonValue): string | undefined {
  const obj = asObject(salary)
  if (!obj) return undefined

  const currency = asString(obj.currency) ?? asString(obj.currencyCode) ?? ''
  const value = obj.value
  const valueObj = asObject(value)

  if (valueObj) {
    const min = asString(valueObj.minValue) ?? asString(valueObj.value)
    const max = asString(valueObj.maxValue)
    const unit = asString(valueObj.unitText) ?? asString(obj.unitText)
    if (min && max) return formatSalary(currency, `${min}–${max}`, unit)
    if (min) return formatSalary(currency, min, unit)
  } else {
    const single = asString(value)
    if (single) return formatSalary(currency, single, undefined)
  }
  return undefined
}

function formatSalary(currency: string, amount: string, unit: string | undefined): string {
  const prefix = currency ? `${currency} ` : ''
  const suffix = unit ? ` / ${unit.toLowerCase()}` : ''
  return `${prefix}${amount}${suffix}`.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Heuristics
// ─────────────────────────────────────────────────────────────────────────────

function parseHeuristics($: CheerioAPI, url: string): ScrapeResult {
  const role = extractRole($)
  const company = extractCompany($)
  const location = extractLocation($)
  const description = extractDescription($)
  const fullText = $('body').text().replace(/\s+/g, ' ').trim()
  const remote_type = detectRemoteType(fullText)
  const contract_type = detectContractType(fullText)
  const salary_range = detectSalary(fullText)
  const posted_at = extractPostedDate($)

  const result: ScrapeResult = {
    url,
    role,
    company,
    location,
    job_description: description,
    remote_type,
    contract_type,
    salary_range,
    posted_at,
    confidence: role && company ? 'medium' : 'low',
  }

  // Strip any null or undefined keys so callers see the shape they expect.
  for (const key of Object.keys(result) as (keyof ScrapeResult)[]) {
    if (result[key] == null) delete result[key]
  }

  return result
}

function extractRole($: CheerioAPI): string | undefined {
  const selectors = [
    'h1[class*="job"]',
    'h1[class*="title"]',
    '[data-testid*="title" i]',
    '[data-testid*="job-title" i]',
    '[id*="job-title" i]',
    '[class*="job-title" i]',
    '[class*="jobtitle" i]',
    '[class*="position-title" i]',
    '[class*="posting-headline" i]',
    'h1',
    'h2[class*="title" i]',
  ]
  for (const sel of selectors) {
    const raw = firstText($, sel)
    const cleaned = cleanRoleTitle(raw)
    if (cleaned) return cleaned
  }
  // Last-ditch: og:title
  const og = $('meta[property="og:title"]').attr('content')
  return cleanRoleTitle(og)
}

function cleanRoleTitle(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let title = raw.replace(/\s+/g, ' ').trim()
  // Strip trailing " at Company", " | Company", " - Company", " @ Company"
  title = title.replace(/\s+(?:at|@|[-|·•—–])\s+[^|·•—–]+$/i, '').trim()
  return title || undefined
}

function extractCompany($: CheerioAPI): string | undefined {
  const og = $('meta[property="og:site_name"]').attr('content')
  if (og && og.trim()) return og.trim()

  const selectors = [
    '[itemprop="hiringOrganization"]',
    '[data-testid*="company" i]',
    '[data-testid*="employer" i]',
    '[class*="company-name" i]',
    '[class*="companyName" i]',
    '[class*="employer-name" i]',
    '[class*="employerName" i]',
    '[class*="company" i] a',
    '[class*="company" i]',
    '[class*="employer" i]',
  ]
  for (const sel of selectors) {
    const text = firstText($, sel)
    if (text) {
      const cleaned = text.replace(/\s+/g, ' ').trim()
      // Avoid pulling in obvious nav blobs.
      if (cleaned.length > 0 && cleaned.length < 120) return cleaned
    }
  }

  const author = $('meta[name="author"]').attr('content')
  if (author && author.trim()) return author.trim()

  return undefined
}

function extractLocation($: CheerioAPI): string | undefined {
  const selectors = [
    '[itemprop="jobLocation"]',
    '[itemprop="address"]',
    '[data-testid*="location" i]',
    '[class*="job-location" i]',
    '[class*="jobLocation" i]',
    '[class*="location" i]',
  ]
  for (const sel of selectors) {
    const text = firstText($, sel)
    if (text) {
      const cleaned = text.replace(/\s+/g, ' ').trim()
      if (cleaned.length > 0 && cleaned.length < 160) return cleaned
    }
  }

  // "Location: Paris, France" patterns
  const body = $('body').text()
  const m = body.match(/Location[:\s]+([A-Z][A-Za-z .'-]+(?:,\s*[A-Z][A-Za-z .'-]+){0,2})/)
  if (m) return m[1].trim()

  return undefined
}

function extractDescription($: CheerioAPI): string | undefined {
  // Drop noise before measuring.
  const $clone = $.root().clone()
  $clone.find('script, style, noscript, nav, header, footer, form, svg, iframe').remove()

  const selectors = [
    '[itemprop="description"]',
    '[class*="job-description" i]',
    '[class*="jobDescription" i]',
    '[id*="job-description" i]',
    '[id*="jobDescription" i]',
    '[class*="job-details" i]',
    '[class*="description" i]',
    'article',
    'main',
  ]

  let best: { text: string; length: number } | undefined
  for (const sel of selectors) {
    $clone.find(sel).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (text.length > (best?.length ?? 0)) best = { text, length: text.length }
    })
    if (best && best.length > 200) break
  }

  if (!best) {
    const fallback = $clone.find('body').text().replace(/\s+/g, ' ').trim()
    if (fallback) best = { text: fallback, length: fallback.length }
  }

  if (!best || best.length === 0) return undefined
  return truncate(best.text, MAX_DESCRIPTION_LENGTH)
}

function detectRemoteType(text: string): RemoteType | undefined {
  const lower = text.toLowerCase()
  const hasHybrid = /\bhybrid\b/.test(lower)
  const hasRemote = /\b(?:remote|work from home|wfh|telecommute)\b/.test(lower)
  const hasOnsite = /\b(?:on[-\s]?site|in[-\s]?office|in person)\b/.test(lower)

  if (hasHybrid) return 'hybrid'
  if (hasRemote) return 'remote'
  if (hasOnsite) return 'onsite'
  return undefined
}

function detectContractType(text: string): ContractType | undefined {
  const lower = text.toLowerCase()
  if (/\b(?:intern(?:ship)?)\b/.test(lower)) return 'internship'
  if (/\b(?:part[-\s]?time)\b/.test(lower)) return 'part-time'
  if (/\b(?:contract(?:or)?|freelance|contract role)\b/.test(lower)) return 'contract'
  if (/\b(?:full[-\s]?time|permanent)\b/.test(lower)) return 'full-time'
  return undefined
}

function detectSalary(text: string): string | undefined {
  // Common compensation patterns. We prefer a range, then a single figure.
  const rangeRegex =
    /([$£€¥])\s?(\d{1,3}(?:[,.\s]\d{3})+|\d{2,3})(?:k|K)?\s?[-–—to]+\s?([$£€¥])?\s?(\d{1,3}(?:[,.\s]\d{3})+|\d{2,3})(?:k|K)?/
  const rangeMatch = text.match(rangeRegex)
  if (rangeMatch) return rangeMatch[0].replace(/\s+/g, ' ').trim()

  const singleRegex = /([$£€¥])\s?\d{1,3}(?:[,.\s]\d{3})+(?:\s?(?:per year|\/yr|\/year|annually))?/i
  const singleMatch = text.match(singleRegex)
  if (singleMatch) return singleMatch[0].replace(/\s+/g, ' ').trim()

  return undefined
}

function extractPostedDate($: CheerioAPI): string | undefined {
  // 1. <time datetime="...">
  const time = $('time[datetime]').first().attr('datetime')
  if (time) {
    const iso = isoDateOnly(time)
    if (iso) return iso
  }

  // 2. Generic [datetime] attributes
  const dt = $('[datetime]').first().attr('datetime')
  if (dt) {
    const iso = isoDateOnly(dt)
    if (iso) return iso
  }

  // 3. Microdata
  const itemprop = $('[itemprop="datePosted"]').first().attr('content') ?? $('[itemprop="datePosted"]').first().text()
  if (itemprop) {
    const iso = isoDateOnly(itemprop)
    if (iso) return iso
  }

  // 4. "Posted X days ago" / "Posted today" / "Posted yesterday"
  const body = $('body').text()
  const relative = body.match(/Posted\s+(today|yesterday|(\d+)\s+(day|week|month)s?\s+ago)/i)
  if (relative) {
    const iso = relativeToIso(relative[1])
    if (iso) return iso
  }

  // 5. Bare ISO date in body
  const isoMatch = body.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (isoMatch) return isoMatch[1]

  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function firstText($: CheerioAPI, selector: string): string | undefined {
  const el = $(selector).first()
  if (el.length === 0) return undefined
  const text = el.text().replace(/\s+/g, ' ').trim()
  return text || undefined
}

function isoDateOnly(input: string): string | undefined {
  // Already YYYY-MM-DD (fast path)
  const direct = input.match(/^(\d{4}-\d{2}-\d{2})/)
  if (direct) return direct[1]

  // Allowlist of parseable formats before falling back to new Date()
  const isAllowed =
    /^\d{4}\/\d{2}\/\d{2}$/.test(input) ||
    /^[A-Za-z]+ \d{1,2},?\s+\d{4}$/.test(input) ||
    /^\d{1,2} [A-Za-z]+ \d{4}$/.test(input)
  if (!isAllowed) return undefined

  const d = new Date(input)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return undefined
}

function relativeToIso(phrase: string): string | undefined {
  const now = new Date()
  const lower = phrase.toLowerCase()
  if (lower === 'today') return now.toISOString().slice(0, 10)
  if (lower === 'yesterday') {
    now.setDate(now.getDate() - 1)
    return now.toISOString().slice(0, 10)
  }
  const m = lower.match(/(\d+)\s+(day|week|month)s?\s+ago/)
  if (!m) return undefined
  const n = parseInt(m[1], 10)
  const unit = m[2]
  if (unit === 'day') now.setDate(now.getDate() - n)
  else if (unit === 'week') now.setDate(now.getDate() - n * 7)
  else if (unit === 'month') now.setMonth(now.getMonth() - n)
  return now.toISOString().slice(0, 10)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trim() + '…'
}
