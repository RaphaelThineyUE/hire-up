import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import Nav from '@/components/marketing/Nav'
import Hero from '@/components/marketing/Hero'
import Features from '@/components/marketing/Features'
import Pricing from '@/components/marketing/Pricing'

describe('marketing nav anchors', () => {
  it('every nav anchor link resolves to an id on the page', () => {
    render(
      <div>
        <Nav />
        <Hero />
        <Features />
        <Pricing />
      </div>
    )

    const nav = document.querySelector('nav')!
    const anchorLinks = Array.from(nav.querySelectorAll('a[href^="#"]'))
      .map(a => a.getAttribute('href') as string)

    expect(anchorLinks.length).toBeGreaterThan(0)

    for (const href of anchorLinks) {
      const id = href.slice(1)
      const target = document.getElementById(id)
      expect(target, `Nav link "${href}" has no matching id="${id}" on the page`).not.toBeNull()
    }
  })
})
