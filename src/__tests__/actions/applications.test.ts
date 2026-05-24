import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { listApplications, createApplication, deleteApplication } from '@/actions/applications'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockFrom = vi.fn()
const mockAuth = { getUser: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()

  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockAuth,
    from: mockFrom,
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete.mockReturnValue({ eq: mockEq }),
  })
  mockSelect.mockReturnValue({ order: mockOrder })
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: '1', company: 'ACME', role: 'Engineer',
          status: 'applied', applied_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        error: null,
      }),
    }),
  })
  mockEq.mockResolvedValue({ error: null })
})

describe('listApplications', () => {
  it('returns empty array when user has no applications', async () => {
    const result = await listApplications()
    expect(result).toEqual([])
    expect(mockFrom).toHaveBeenCalledWith('applications')
  })
})

describe('createApplication', () => {
  it('inserts with correct user_id', async () => {
    const formData = new FormData()
    formData.set('company', 'ACME')
    formData.set('role', 'Engineer')
    await createApplication(formData)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'ACME', role: 'Engineer', user_id: 'user-123' })
    )
  })
})

describe('deleteApplication', () => {
  it('deletes by id', async () => {
    await deleteApplication('app-abc')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('id', 'app-abc')
  })
})
