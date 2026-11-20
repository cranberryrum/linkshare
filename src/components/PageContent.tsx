import React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Page, PAGES, SITE_URL } from '../content/pages'

// Below-the-fold content: how it works, FAQ and links to the other use-case
// pages. Real, visible text for search engines and for people who scroll.
export const PageContent: React.FC<{ page: Page }> = ({ page }) => {
  const others = PAGES.filter(p => p.slug !== page.slug)
  const useCases = others.filter(p => p.kind !== 'comparison')
  const comparisons = others.filter(p => p.kind === 'comparison')
  const label = (p: Page) => p.navLabel ?? (p.slug ? p.h1 : 'Share a link between any two devices')
  const cmp = page.comparison

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
      {cmp && (
        <section aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="text-lg font-semibold text-gray-900 mb-3">
            Linkshare vs {cmp.them}
          </h2>
          {/* One block per feature: label on top, the two answers side by side.
              Reads well at phone width, unlike a 3-column table. */}
          <div className="card">
            <div className="grid grid-cols-2 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900">
              <span className="text-blue-600">Linkshare</span>
              <span>{cmp.them}</span>
            </div>
            <dl className="divide-y divide-gray-200">
              {cmp.rows.map(row => (
                <div key={row.feature} className="px-4 py-3">
                  <dt className="text-xs font-medium text-gray-400">{row.feature}</dt>
                  <dd className="mt-1 grid grid-cols-2 gap-3 text-sm leading-snug">
                    <span className="text-gray-900">{row.linkshare}</span>
                    <span className="text-gray-500">{row.them}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-gray-900">Which should you use?</h3>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-gray-500">
            <li className="flex gap-2.5">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span><span className="font-medium text-gray-700">{cmp.them}</span> if {lower(cmp.useThemWhen)}</span>
            </li>
            <li className="flex gap-2.5">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <span><span className="font-medium text-gray-700">Linkshare</span> if {lower(cmp.useLinkshareWhen)}</span>
            </li>
          </ul>
        </section>
      )}

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
        <LinkList pages={useCases} label={label} />
        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Compare Linkshare</h2>
        <LinkList pages={comparisons} label={label} />
      </nav>
    </div>
  )
}

// "Snapdrop & PairDrop if You want…" reads oddly; lower-case the first letter
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

const LinkList: React.FC<{ pages: Page[]; label: (p: Page) => string }> = ({ pages, label }) => (
  <ul className="flex flex-wrap gap-2">
    {pages.map(p => (
      <li key={p.path}>
        <a
          href={p.path}
          className="inline-block rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          {label(p)}
        </a>
      </li>
    ))}
  </ul>
)
