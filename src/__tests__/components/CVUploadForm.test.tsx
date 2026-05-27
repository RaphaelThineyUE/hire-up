import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/actions/cv', () => ({
  uploadCV: vi.fn().mockResolvedValue({}),
  deleteCV: vi.fn().mockResolvedValue(undefined),
  setDefaultCV: vi.fn().mockResolvedValue({}),
}))

import { CVUploadForm } from '@/components/app/CVUploadForm'
import { uploadCV } from '@/actions/cv'
import type { CV } from '@/lib/types'

const mockCV: CV = {
  id: 'cv-1',
  user_id: 'user-123',
  filename: 'resume.pdf',
  storage_path: 'user-123/uuid.pdf',
  extracted_text: 'Senior engineer with 10 years experience in distributed systems.',
  word_count: 11,
  is_default: true,
  created_at: '2024-01-15T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CVUploadForm', () => {
  it('shows empty state and Add CV button when no CVs', () => {
    render(<CVUploadForm cvs={[]} />)
    expect(screen.getByText('No CVs uploaded yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add CV/i })).toBeInTheDocument()
  })

  it('renders CV card with filename, word count, and default badge', () => {
    render(<CVUploadForm cvs={[mockCV]} />)
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByText(/11 words/)).toBeInTheDocument()
  })

  it('file input is hidden — only visible via Add CV button', () => {
    render(<CVUploadForm cvs={[]} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.style.display).toBe('none')
  })

  it('calls uploadCV with the selected file', async () => {
    render(<CVUploadForm cvs={[]} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf content'], 'my-cv.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(uploadCV).toHaveBeenCalledOnce()
      const formData = (uploadCV as ReturnType<typeof vi.fn>).mock.calls[0][0] as FormData
      expect(formData.get('cv')).toBe(file)
    })
  })

  it('shows error message when upload fails', async () => {
    vi.mocked(uploadCV).mockResolvedValueOnce({ error: 'Only PDF and DOCX are supported' })

    render(<CVUploadForm cvs={[]} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'bad.txt')] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Only PDF and DOCX are supported')).toBeInTheDocument()
    })
  })

  it('expands and collapses extracted text preview', async () => {
    render(<CVUploadForm cvs={[mockCV]} />)

    const expandBtn = screen.getByTitle('Show preview')
    fireEvent.click(expandBtn)

    await waitFor(() => {
      expect(screen.getByText('Extracted text preview')).toBeInTheDocument()
      expect(screen.getByText(/Senior engineer/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Hide preview'))
    await waitFor(() => {
      expect(screen.queryByText('Extracted text preview')).not.toBeInTheDocument()
    })
  })

  it('does not show expand button when CV has no extracted text', () => {
    const noText: CV = { ...mockCV, extracted_text: null }
    render(<CVUploadForm cvs={[noText]} />)
    expect(screen.queryByTitle('Show preview')).not.toBeInTheDocument()
  })

  it('does not show set-default button for the default CV', () => {
    render(<CVUploadForm cvs={[mockCV]} />)
    expect(screen.queryByTitle('Set as default CV')).not.toBeInTheDocument()
  })

  it('shows set-default button for non-default CVs', () => {
    const nonDefault: CV = { ...mockCV, id: 'cv-2', filename: 'other.pdf', is_default: false }
    render(<CVUploadForm cvs={[mockCV, nonDefault]} />)
    expect(screen.getByTitle('Set as default CV')).toBeInTheDocument()
  })
})
