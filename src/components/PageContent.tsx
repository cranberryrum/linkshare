import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Page, PAGES, SITE_URL } from '../content/pages'
import { QuickAccess } from './QuickAccess'

// Below-the-fold content: how it works, FAQ and links to the other use-case
// pages. Real, visible text for search engines and for people who scroll.
export const PageContent: React.FC<{ page: Page }> = ({ page }) => {
  const others = PAGES.filter(p => p.slug !== page.slug)

  // Google only uses FAQ markup that matches questions visible on the page,
  // so it's generated from the same list that renders below.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: SITE_URL + page.path,
    mainEntity: page.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }

  return (
    <div className="max-w-[480px] mx-auto w-full px-8 pt-8 sm:pt-12 pb-12 space-y-14">
      <QuickAccess />

      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-6">
        <h2 id="how-heading" className="text-lg font-semibold text-gray-900 mb-5">
          {page.stepsHeading}
        </h2>
        <ol className="space-y-4">
          {page.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-mono text-sm font-semibold text-blue-600"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-semibold text-gray-900 mb-3">
          Questions
        </h2>
        <div className="card divide-y divide-gray-200">
          {page.faqs.map(f => (
            <details key={f.q} className="faq group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-gray-900">
                {f.q}
                <ChevronDown
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-4 -mt-1 text-sm leading-relaxed text-gray-500">{f.a}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </section>

      <nav aria-labelledby="more-heading">
        <h2 id="more-heading" className="text-lg font-semibold text-gray-900 mb-3">
          {page.slug ? 'More ways to use Linkshare' : 'Ways to use Linkshare'}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {others.map(p => (
            <li key={p.path}>
              <a
                href={p.path}
                className="inline-block rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                {p.slug ? p.h1 : 'Share a link between any two devices'}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
