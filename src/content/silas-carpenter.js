/**
 * Silas Carpenter - One Sheet / EPK Configuration
 *
 * Edit this file to update all content on the one-sheet page.
 * Images are referenced from /public/artists/silas/
 *
 * Required images:
 *   hero.png              - Hero portrait (full-color headshot)
 *   logo.png              - Artist name/logo with transparent background
 *   illustration.png      - Line art illustration (optional decorative)
 *   album-*.png           - Album / single artwork
 */

export default {
  // ── Identity ────────────────────────────────────────────
  name: "Silas Carpenter",
  tagline:
    "Bedroom-built indie from Arkansas. Every part, every note, one person.",

  // ── Images ──────────────────────────────────────────────
  hero: {
    image: "/artists/silas/hero.png",
    alt: "Silas Carpenter portrait",
  },
  logo: "/artists/silas/logo.png",
  illustration: "/artists/silas/illustration.png",

  // ── Bio ─────────────────────────────────────────────────
  bio: {
    short:
      "19-year-old indie musician from Arkansas who writes, plays, records, and produces everything himself.",
    blocks: [
      {
        heading: "The Artist",
        text: "Silas Carpenter is a 19-year-old indie musician from Arkansas. Working out of a bedroom studio, he builds full songs from scratch: vocals, guitars, bass, keys, and drums. The process is fast, self-contained, and entirely hands-on.",
      },
      {
        heading: "The Sound",
        text: "Intimate, lyric-forward indie with quiet tension, sharp lines, and melodies that linger. The vocal layering nods to Elliott Smith, but the approach is entirely his own: one person, one room, a full band\u2019s worth of parts.",
      },
      {
        heading: "The Process",
        text: "A steady output driven by obsession more than strategy. Every song starts and finishes in the same bedroom studio, with every instrument tracked by the same pair of hands. No collaborators, no outside production, no shortcuts.",
      },
    ],
  },

  // ── Highlights ──────────────────────────────────────────
  highlights: [
    "Writes, records, and produces entirely solo",
    "Full instrumentation: vocals, guitar, bass, keys, drums",
    "Bedroom studio, Searcy, Arkansas",
    "5 albums & 13+ singles since 2023",
    "Influenced by Elliott Smith, built on his own terms",
  ],

  // ── Links ───────────────────────────────────────────────
  links: {
    listen:
      "https://samply.app/p/rH3tOttiXAI4D4RYG2jj?si=sGcrq26TM0caiNL6NjRUikeicR32",
    spotify: "https://open.spotify.com/artist/4aiyliWs6AJkz9tMBreXwO",
    appleMusic:
      "https://music.apple.com/us/artist/silas-carpenter/1675376911",
  },

  // ── Hero Music Embed ──────────────────────────────────
  // Untitled.stream player - serves as the primary listening experience
  heroEmbed: "https://untitled.stream/embed/7XkubrxS6dkR",

  // ── Social Profiles ─────────────────────────────────────
  socials: [
    {
      platform: "spotify",
      url: "https://open.spotify.com/artist/4aiyliWs6AJkz9tMBreXwO",
      label: "Spotify",
    },
    {
      platform: "apple-music",
      url: "https://music.apple.com/us/artist/silas-carpenter/1675376911",
      label: "Apple Music",
    },
    {
      platform: "instagram",
      url: "https://www.instagram.com/silas.carpenter/",
      label: "Instagram",
    },
    {
      platform: "tiktok",
      url: "https://www.tiktok.com/@silas.carpenter2",
      label: "TikTok",
    },
  ],

  // ── Releases ────────────────────────────────────────────
  // Ordered newest-first for EPK display.
  releases: [
    {
      title: "The Big Idea",
      year: 2025,
      type: "Album",
      cover: "/artists/silas/album-4.png",
      featured: true,
      blurb:
        "13 tracks exploring love, heartbreak, ego, and insecurity. Gained viral traction on TikTok.",
    },
    {
      title: "My Mind",
      year: 2025,
      type: "Album",
      cover: "/artists/silas/album-2.png",
      blurb:
        "Written and recorded in 3 weeks\u2014one song per day for 8 consecutive days. A diary of a high-school breakup.",
    },
    {
      title: "Love Never Hurt Nobody",
      year: 2024,
      type: "Single",
      cover: "/artists/silas/album-5.png",
      blurb:
        "An intimate, self-produced single capturing the tension between tenderness and heartbreak.",
    },
    {
      title: "BEDTIME SONGS",
      year: 2024,
      type: "Album",
      cover: "/artists/silas/album-3.png",
      blurb: "8 nocturnal tracks\u2014moody, stripped-back, and confessional.",
    },
  ],

  // ── TikTok Featured Video ───────────────────────────────
  tiktok: {
    videoId: "7572808197795237150",
    username: "silas.carpenter2",
  },

  // ── Contact ─────────────────────────────────────────────
  contacts: [
    { label: "General Inquiries", email: "theo@allmyfriendsinc.com" },
  ],

  // ── Press Quotes (optional) ─────────────────────────────
  // Add quotes as: { text: "Quote text", source: "Publication", url: "https://..." }
  quotes: [],

  // ── Downloadable Assets (optional) ──────────────────────
  // Add assets as: { label: "Press Photos", url: "/assets/silas/press-kit.zip", type: "zip" }
  assets: [],
};
