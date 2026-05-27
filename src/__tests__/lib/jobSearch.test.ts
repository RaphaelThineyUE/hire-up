import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchJobs } from '@/lib/jobSearch'

const defaultOpts = {
  num_pages: '2',
  country: '',
  language: '',
  location: '',
  date_posted: '',
  work_from_home: false,
  employment_types: '',
  job_requirements: '',
  radius: '',
}

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('searchJobs', () => {
  it('returns data array from API response', async () => {
    const jobs = [{ job_id: '1', job_title: 'Engineer' }]
    mockFetch(200, { data: jobs })
    const result = await searchJobs('software engineer', 'api-key', defaultOpts)
    expect(result).toEqual(jobs)
  })

  it('returns empty array when body.data is absent', async () => {
    mockFetch(200, {})
    const result = await searchJobs('engineer', 'api-key', defaultOpts)
    expect(result).toEqual([])
  })

  it('throws jsearch_401 on 401 response', async () => {
    mockFetch(401, {})
    await expect(searchJobs('engineer', 'key', defaultOpts)).rejects.toThrow('jsearch_401')
  })

  it('throws jsearch_429 on 429 response', async () => {
    mockFetch(429, {})
    await expect(searchJobs('engineer', 'key', defaultOpts)).rejects.toThrow('jsearch_429')
  })

  it('throws jsearch_error on other non-ok response', async () => {
    mockFetch(500, {})
    await expect(searchJobs('engineer', 'key', defaultOpts)).rejects.toThrow('jsearch_error')
  })

  it('sends correct RapidAPI headers with the provided key', async () => {
    const fetchSpy = mockFetch(200, { data: [] })
    await searchJobs('engineer', 'my-api-key', defaultOpts)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('jsearch.p.rapidapi.com'),
      expect.objectContaining({
        headers: {
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          'X-RapidAPI-Key': 'my-api-key',
        },
      }),
    )
  })

  it('defaults num_pages to 2 when empty string is passed', async () => {
    const fetchSpy = mockFetch(200, { data: [] })
    await searchJobs('engineer', 'key', { ...defaultOpts, num_pages: '' })
    expect(fetchSpy.mock.calls[0][0] as string).toContain('num_pages=2')
  })

  it('includes optional params when set', async () => {
    const fetchSpy = mockFetch(200, { data: [] })
    await searchJobs('engineer', 'key', {
      ...defaultOpts,
      country: 'US',
      location: 'New York',
      date_posted: 'today',
      work_from_home: true,
      employment_types: 'FULLTIME',
      job_requirements: 'no_experience',
      radius: '50',
    })
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('country=US')
    expect(url).toContain('location=New+York')
    expect(url).toContain('date_posted=today')
    expect(url).toContain('work_from_home=true')
    expect(url).toContain('employment_types=FULLTIME')
    expect(url).toContain('job_requirements=no_experience')
    expect(url).toContain('radius=50')
  })

  it('omits optional params when empty or false', async () => {
    const fetchSpy = mockFetch(200, { data: [] })
    await searchJobs('engineer', 'key', defaultOpts)
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).not.toContain('country=')
    expect(url).not.toContain('location=')
    expect(url).not.toContain('work_from_home')
  })
})
