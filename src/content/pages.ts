import { comparisonPages } from './comparisons'
// Every indexable page on the site. The build prerenders one HTML file per
// entry (scripts/prerender.mjs) and the app picks the page from the URL.
// Keep claims here true to how the product actually works.

export interface Faq {
  q: string
  a: string
}

// Side-by-side for /vs/ pages. Keep every claim about the other product
// fair and checkable; say where it's the better choice.
export interface Comparison {
  them: string // the other product's name, as people search for it
  rows: { feature: string; linkshare: string; them: string }[]
  useThemWhen: string
  useLinkshareWhen: string
}

export interface Page {
  kind?: 'use-case' | 'comparison' // default: use-case
  navLabel?: string // short label for links from other pages (defaults to h1)
  comparison?: Comparison
  slug: string // '' for the home page
  path: string // URL path, always with a trailing slash
  title: string // <title>, ~60 characters max
  description: string // meta description, ~155 characters max
  h1: string
  intro: string
  steps: { title: string; body: string }[]
  stepsHeading: string
  faqs: Faq[]
}

// Answers every page shares, after its own questions
export const COMMON_FAQS: Faq[] = [
  {
    q: 'Do I need an account or an app?',
    a: 'No. Linkshare works in any web browser on any phone, tablet or computer. There is nothing to install and no sign-up.'
  },
  {
    q: 'How long does a code last?',
    a: 'You choose when you drop it: 10 minutes, 1 hour, 1 day, or one view, which deletes it the moment it’s opened. When the time runs out the code stops working and the content is wiped.'
  },
  {
    q: 'Is it private?',
    a: 'Content is only shown to someone who enters the right code, and repeated wrong guesses from the same network are temporarily blocked. Codes are short-lived, so don’t use Linkshare for passwords or anything you couldn’t afford a stranger to see.'
  },
  {
    q: 'What can I share?',
    a: 'Any link or plain text up to 400 characters, such as a URL, an address, a note or a Wi-Fi name. You can have up to 5 active drops at a time, and you can edit or delete them before they expire.'
  }
]

const HOME_STEPS = [
  {
    title: 'Drop it',
    body: 'Paste a link or type a message on the device you have it on.'
  },
  {
    title: 'Get a code',
    body: 'You get a 4-digit code and a QR code that last 10 minutes, 1 hour, 1 day, or for one view only.'
  },
  {
    title: 'Receive it',
    body: 'On the other device, open linkshare.live, tap Receive and enter the code, or just scan the QR.'
  }
]

export const PAGES: Page[] = [
  {
    slug: '',
    path: '/',
    title: 'Share Links Online Between Devices, No Login | Linkshare',
    description:
      'Share links and text online between any two devices with a 4-digit code. Works in any browser: no sign-up, no app. Codes last 10 minutes to a day.',
    h1: 'Share a link between any two devices',
    intro: 'Drop it here, get a 4-digit code, type it on the other device. No sign-up, no app.',
    stepsHeading: 'How it works',
    steps: HOME_STEPS,
    faqs: COMMON_FAQS
  },
  {
    slug: 'phone-to-pc',
    path: '/phone-to-pc/',
    title: 'Send a Link from Phone to PC Instantly, No Login | Linkshare',
    description:
      'Get a link from your phone onto your laptop or PC in seconds. Drop it, get a 4-digit code, type it on your computer. No email, no app, no sign-in.',
    h1: 'Send a link from your phone to your PC',
    intro:
      'Skip emailing yourself. Drop the link on your phone and type the 4-digit code on your computer.',
    stepsHeading: 'How to send a link from your phone to your computer',
    steps: [
      {
        title: 'On your phone',
        body: 'Open linkshare.live, paste the link and tap Drop It.'
      },
      {
        title: 'Note the code',
        body: 'You’ll see a 4-digit code. It stays valid for as long as you chose: 10 minutes, 1 hour, 1 day, or until it’s opened once.'
      },
      {
        title: 'On your computer',
        body: 'Open linkshare.live, choose Receive and enter the code. Click to open the link or copy it.'
      }
    ],
    faqs: [
      {
        q: 'Does it work between iPhone and Windows, or Android and Mac?',
        a: 'Yes. Linkshare runs in the browser, so it works between any phone and any computer, whatever brand or operating system.'
      },
      {
        q: 'Can I go the other way, from PC to phone?',
        a: 'Yes. Drop the link on your computer, then scan the QR code with your phone’s camera. Linkshare opens with the link ready to open or copy, no typing needed.'
      },
      ...COMMON_FAQS
    ]
  },
  {
    slug: 'share-text-between-devices',
    path: '/share-text-between-devices/',
    title: 'Share Text Between Devices Without Signing In | Linkshare',
    description:
      'Move a note, address or snippet of text from one device to another with a 4-digit code. Works in any browser. No account, no app, no copy-paste apps.',
    h1: 'Share text between devices, no sign-in',
    intro:
      'Type or paste up to 400 characters, get a 4-digit code, and enter it on the other device.',
    stepsHeading: 'How to share text from one device to another',
    steps: [
      {
        title: 'Paste your text',
        body: 'An address, a note, a tracking number: anything up to 400 characters.'
      },
      {
        title: 'Get a code',
        body: 'Pick how long it should last and tap Drop It to get a 4-digit code and QR code.'
      },
      {
        title: 'Copy it on the other device',
        body: 'Enter the code on linkshare.live and tap copy. Links in the text can be opened directly.'
      }
    ],
    faqs: [
      {
        q: 'Is there a shared clipboard between my devices?',
        a: 'Some devices from the same brand share a clipboard, but it rarely works across brands. Linkshare works between any two devices with a browser, including someone else’s.'
      },
      {
        q: 'Can I share with someone else, not just my own devices?',
        a: 'Yes. Read out the code or show them the QR code. They don’t need an account either.'
      },
      ...COMMON_FAQS
    ]
  },
  {
    slug: 'airdrop-alternative',
    path: '/airdrop-alternative/',
    title: 'AirDrop Alternative for Links & Text on Any Device | Linkshare',
    description:
      'Like AirDrop for links and text, but for Android, Windows, Mac, iPhone and Linux. Share with a 4-digit code in any browser. No app, no pairing, no sign-up.',
    h1: 'An AirDrop alternative that works on any device',
    intro:
      'Send links and text between Android, iPhone, Windows, Mac and Linux. Just a browser and a 4-digit code.',
    stepsHeading: 'How to send a link without AirDrop',
    steps: [
      {
        title: 'Drop the link',
        body: 'On any device, open linkshare.live and paste the link or text.'
      },
      {
        title: 'Share the code',
        body: 'Read out the 4-digit code or show the QR code. No pairing, Bluetooth or same Wi-Fi needed.'
      },
      {
        title: 'Open it anywhere',
        body: 'The other person enters the code on linkshare.live or scans the QR, on any phone or computer.'
      }
    ],
    faqs: [
      {
        q: 'How is this different from AirDrop?',
        a: 'AirDrop only works between nearby Apple devices and can send files. Linkshare works between any two devices with a browser, anywhere, but it is for links and text up to 400 characters, not files.'
      },
      {
        q: 'Do both devices need to be on the same Wi-Fi?',
        a: 'No. Both devices just need an internet connection. They can be in different places.'
      },
      ...COMMON_FAQS
    ]
  }
]

export const HOME = PAGES[0]

// Comparison pages live in their own file to keep this one readable
PAGES.push(...comparisonPages(COMMON_FAQS))

export const SITE_URL = 'https://linkshare.live'

// Match the current URL to a page; anything unknown falls back to home
export const pageForPath = (pathname: string): Page => {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return PAGES.find(p => p.slug === slug) ?? HOME
}
