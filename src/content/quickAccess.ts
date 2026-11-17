import { SITE_URL } from './pages'

// iCloud link to the "Send to Linkshare" Apple Shortcut. iPhone web apps can't
// appear in the share sheet, so a Shortcut does it instead: it takes the shared
// link or text and opens  https://linkshare.live/?via=shortcut&text=<encoded>.
// Leave empty until the Shortcut is published; the iPhone tab then hides that row.
export const IOS_SHORTCUT_URL = ''

// Dragged to the bookmarks bar. On any page it opens Linkshare with that page's
// link (or the selected text) already in the Drop box.
export const BOOKMARKLET =
  'javascript:(()=>{' +
  'const s=String(getSelection()).trim();' +
  "const p=s?'text='+encodeURIComponent(s.slice(0,400)):'url='+encodeURIComponent(location.href);" +
  `window.open('${SITE_URL}/?via=bookmarklet&'+p,'_blank')` +
  '})()'
