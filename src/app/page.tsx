import Nav from '@/components/marketing/Nav'
import Hero from '@/components/marketing/Hero'
import BoardStrip from '@/components/marketing/BoardStrip'
import Features from '@/components/marketing/Features'
import Pricing from '@/components/marketing/Pricing'
import FinalCTA from '@/components/marketing/FinalCTA'
import Footer from '@/components/marketing/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BoardStrip />
        <Features />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
