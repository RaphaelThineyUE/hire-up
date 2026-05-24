import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const format = request.nextUrl.searchParams.get('format') ?? 'pdf'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const markdown = doc.content_markdown ?? ''
  const filename = `${doc.type.replace('_', '-')}`

  if (format === 'docx') {
    const { Document, Paragraph, TextRun, Packer } = await import('docx')
    const paragraphs = markdown.split('\n').map((line: string) =>
      new Paragraph({ children: [new TextRun(line.replace(/^#{1,6}\s/, '').replace(/[*_`]/g, ''))] })
    )
    const docxDoc = new Document({ sections: [{ children: paragraphs }] })
    const buffer = await Packer.toBuffer(docxDoc)
    return new NextResponse(Buffer.from(await buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
      },
    })
  }

  // PDF via pdfkit
  const PDFDocument = (await import('pdfkit')).default
  const chunks: Buffer[] = []
  const pdfDoc = new PDFDocument({ margin: 72 })
  pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
  await new Promise<void>(resolve => {
    pdfDoc.on('end', resolve)
    for (const line of markdown.split('\n')) {
      const clean = line.replace(/^#{1,6}\s/, '').replace(/[*_`]/g, '')
      if (line.match(/^#{1,2}\s/)) {
        pdfDoc.fontSize(16).font('Helvetica-Bold').text(clean).moveDown(0.3)
      } else if (line.match(/^#{3,6}\s/)) {
        pdfDoc.fontSize(13).font('Helvetica-Bold').text(clean).moveDown(0.2)
      } else if (clean.trim()) {
        pdfDoc.fontSize(11).font('Helvetica').text(clean).moveDown(0.1)
      } else {
        pdfDoc.moveDown(0.4)
      }
    }
    pdfDoc.end()
  })

  const pdfBuffer = Buffer.concat(chunks)
  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    },
  })
}
