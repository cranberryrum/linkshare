import type { Faq, Page } from './pages'

// "Linkshare vs X" pages for people comparing ways to move a link or some
// text to another device. Rules for this file:
// - Every claim about another product must be fair and checkable. Say what
//   it does well and when it's the better choice.
// - Only claim for Linkshare what it really does: links and text up to 400
//   characters, a 4-digit code or QR, no account, no app, any browser,
//   10 min / 1 hour / 1 day / one view.

const LINKSHARE_STEPS = [
  {
    title: 'Drop it',
    body: 'Open linkshare.live on the device that has the link and paste it.'
  },
  {
    title: 'Get a code',
    body: 'You get a 4-digit code and a QR code. Choose 10 minutes, 1 hour, 1 day or one view.'
  },
  {
    title: 'Open it anywhere',
    body: 'On the other device, open linkshare.live and enter the code, or scan the QR.'
  }
]

export const comparisonPages = (common: Faq[]): Page[] => [
  {
    kind: 'comparison',
    slug: 'vs/snapdrop-pairdrop',
    path: '/vs/snapdrop-pairdrop/',
    navLabel: 'vs Snapdrop & PairDrop',
    title: 'Snapdrop & PairDrop Alternative for Links and Text | Linkshare',
    description:
      'Snapdrop and PairDrop are great for files on the same Wi-Fi. Linkshare sends links and text anywhere with a 4-digit code: no pairing, no account.',
    h1: 'A Snapdrop & PairDrop alternative for links and text',
    intro:
      'Send a link or note to any device, on any network, with a 4-digit code. No pairing and no account.',
    stepsHeading: 'How to send a link without Snapdrop',
    steps: LINKSHARE_STEPS,
    comparison: {
      them: 'Snapdrop & PairDrop',
      rows: [
        { feature: 'How devices connect', linkshare: 'A 4-digit code or QR', them: 'Devices on the same network see each other; PairDrop can also pair devices or use a room code' },
        { feature: 'Different Wi-Fi or mobile data', linkshare: 'Yes, works anywhere', them: 'Snapdrop: same network. PairDrop: yes, with pairing or a public room' },
        { feature: 'Both devices online at once', linkshare: 'No, the code waits for you', them: 'Yes, the transfer happens live' },
        { feature: 'Files and photos', linkshare: 'No, links and text only', them: 'Yes' },
        { feature: 'Account or app', linkshare: 'None', them: 'None' },
        { feature: 'How long it lasts', linkshare: '10 min to 1 day, or one view', them: 'Only while both are connected' }
      ],
      useThemWhen:
        'You want to send files or photos, and both devices are nearby and online at the same time.',
      useLinkshareWhen:
        'You just need a link or some text on another device, maybe on a different network, or the other person will open it later.'
    },
    faqs: [
      {
        q: 'Can Linkshare send files like Snapdrop?',
        a: 'No. Linkshare is for links and text up to 400 characters. For files and photos between nearby devices, Snapdrop or PairDrop are a good choice.'
      },
      {
        q: 'Do both devices need to be on the same Wi-Fi?',
        a: 'No. With Linkshare the two devices can be on different networks or mobile data, and they don’t need to be online at the same time while the code is valid.'
      },
      ...common
    ]
  },
  {
    kind: 'comparison',
    slug: 'vs/phone-link',
    path: '/vs/phone-link/',
    navLabel: 'vs Phone Link',
    title: 'Phone Link Alternative: Send Links to Any PC | Linkshare',
    description:
      'Microsoft Phone Link connects an Android phone or iPhone to a Windows PC. Linkshare sends a link to any computer, Mac or Linux too, with a 4-digit code.',
    h1: 'A Phone Link alternative that works on any computer',
    intro:
      'Send a link from your phone to a Windows PC, a Mac, a Chromebook or a friend’s laptop. No pairing, no account.',
    stepsHeading: 'How to send a link to your PC without Phone Link',
    steps: LINKSHARE_STEPS,
    comparison: {
      them: 'Phone Link',
      rows: [
        { feature: 'Computers it works with', linkshare: 'Any computer with a browser', them: 'Windows PCs' },
        { feature: 'Setup', linkshare: 'None: open the site', them: 'Pair your phone and PC once (Link to Windows app on Android)' },
        { feature: 'Account', linkshare: 'None', them: 'Usually a Microsoft account' },
        { feature: 'Someone else’s computer', linkshare: 'Yes, just give them the code', them: 'No, only your paired PC' },
        { feature: 'Also does', linkshare: 'Links and text only', them: 'Messages, calls, photos and notifications on your PC' }
      ],
      useThemWhen:
        'You use your own Windows PC every day and want your phone’s messages, photos and notifications on it.',
      useLinkshareWhen:
        'You need a link on a Mac, a shared or work computer, or someone else’s laptop, without setting anything up.'
    },
    faqs: [
      {
        q: 'Does Linkshare work with a Mac?',
        a: 'Yes. Linkshare runs in any browser, so it works with Mac, Windows, Linux and Chromebooks, and with iPhone and Android phones.'
      },
      {
        q: 'Do I need to pair my phone first?',
        a: 'No. There’s nothing to pair. Drop the link on your phone and type the 4-digit code on the computer, or scan the QR code the other way round.'
      },
      ...common
    ]
  },
  {
    kind: 'comparison',
    slug: 'vs/send-tab-to-device',
    path: '/vs/send-tab-to-device/',
    navLabel: 'vs Send tab to device',
    title: 'Send Tab to Device Without Signing In | Linkshare',
    description:
      'Chrome and Firefox can send a tab to your devices if you’re signed in to the same browser. Linkshare works across any browsers, with no sign-in.',
    h1: 'Send a tab to another device, without signing in',
    intro:
      'Move a page from Chrome to Safari, Firefox to Edge, or to someone else’s browser, with a 4-digit code.',
    stepsHeading: 'How to send a tab to another device',
    steps: LINKSHARE_STEPS,
    comparison: {
      them: 'Browser “send tab”',
      rows: [
        { feature: 'Browsers', linkshare: 'Any browser to any browser', them: 'The same browser on both devices (Chrome to Chrome, Firefox to Firefox)' },
        { feature: 'Sign-in', linkshare: 'None', them: 'Signed in to the same browser account on both' },
        { feature: 'Someone else’s device', linkshare: 'Yes, give them the code', them: 'No, only your own devices' },
        { feature: 'Plain text, not just pages', linkshare: 'Yes, up to 400 characters', them: 'No, pages only' },
        { feature: 'Already built in', linkshare: 'No, open linkshare.live', them: 'Yes, from the share or tab menu' }
      ],
      useThemWhen:
        'You’re signed in to the same browser everywhere and are sending a page to yourself.',
      useLinkshareWhen:
        'The devices use different browsers, you’re not signed in, it’s someone else’s device, or you want to send text instead of a page.'
    },
    faqs: [
      {
        q: 'Can I send a tab from Chrome to Safari?',
        a: 'Yes. Linkshare works between any browsers: drop the link in one, enter the code in the other.'
      },
      {
        q: 'Is there a one-click way from the browser?',
        a: 'Yes. Add the “Send to Linkshare” button from Get the app to your bookmarks bar. Click it on any page to drop that page’s link.'
      },
      ...common
    ]
  },
  {
    kind: 'comparison',
    slug: 'vs/pushbullet',
    path: '/vs/pushbullet/',
    navLabel: 'vs Pushbullet',
    title: 'Pushbullet Alternative: No App, No Account | Linkshare',
    description:
      'Pushbullet syncs links, files and notifications with an app and account. Linkshare sends a link or text with a 4-digit code: nothing to install.',
    h1: 'A Pushbullet alternative with nothing to install',
    intro:
      'Send a link or some text to any device in seconds. No app, no extension, no account.',
    stepsHeading: 'How to send a link without Pushbullet',
    steps: LINKSHARE_STEPS,
    comparison: {
      them: 'Pushbullet',
      rows: [
        { feature: 'Install', linkshare: 'Nothing, it’s a website', them: 'App or browser extension on each device' },
        { feature: 'Account', linkshare: 'None', them: 'Required' },
        { feature: 'Someone else’s device', linkshare: 'Yes, give them the code', them: 'Mostly your own devices' },
        { feature: 'Files and notifications', linkshare: 'No, links and text only', them: 'Yes' },
        { feature: 'History', linkshare: 'None: deleted when it expires', them: 'Kept in your account' }
      ],
      useThemWhen:
        'You want a permanent, synced history of links and files, and phone notifications on your computer.',
      useLinkshareWhen:
        'You want to move one link right now, on a device you don’t want to install anything on.'
    },
    faqs: [
      {
        q: 'Does Linkshare keep a history like Pushbullet?',
        a: 'No, on purpose. Each drop is deleted when its time runs out, or after one view if you choose that.'
      },
      ...common
    ]
  },
  {
    kind: 'comparison',
    slug: 'vs/email-yourself',
    path: '/vs/email-yourself/',
    navLabel: 'vs Emailing yourself',
    title: 'Stop Emailing Yourself Links: A Faster Way | Linkshare',
    description:
      'Emailing or messaging yourself a link works, but it’s slow and clutters your inbox. Linkshare moves a link to another device with a 4-digit code.',
    h1: 'A faster way than emailing yourself a link',
    intro:
      'Skip the inbox. Drop the link here and type a 4-digit code on the other device.',
    stepsHeading: 'How to send yourself a link without email',
    steps: LINKSHARE_STEPS,
    comparison: {
      them: 'Emailing yourself',
      rows: [
        { feature: 'Steps', linkshare: 'Paste, then type 4 digits', them: 'Compose, address, send, then open your inbox' },
        { feature: 'Sign-in on the other device', linkshare: 'None', them: 'Your email account' },
        { feature: 'Leaves a copy behind', linkshare: 'No, deleted when it expires', them: 'Yes, in sent and inbox' },
        { feature: 'Works on a shared or public computer', linkshare: 'Yes, nothing to log out of', them: 'Only if you sign in to your email there' },
        { feature: 'Keeps a record', linkshare: 'No', them: 'Yes' }
      ],
      useThemWhen: 'You want a permanent record of the link to find later.',
      useLinkshareWhen:
        'You just need the link on the other screen now, especially on a computer where you don’t want to sign in.'
    },
    faqs: [
      {
        q: 'Is it safe to use on a library or work computer?',
        a: 'You don’t sign in to anything, so there’s nothing to log out of. The drop is deleted when its time runs out, or after one view if you choose that.'
      },
      ...common
    ]
  }
]
