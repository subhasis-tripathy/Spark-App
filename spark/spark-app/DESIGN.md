# SPARK design specification (shared by website and app)

One brand, two independent builds. The website is expressive and conversion-oriented; the app is practical and made for daily use. They share these principles, not layouts.

## Emblem
The approved SPARK emblem (luminous S, thin orbit, a spark of light at its centre) and wordmark are used **unmodified** from the supplied logo. Never redraw or recolour them. On light surfaces the emblem sits on its own black tile, exactly like the launcher icon. The hero, welcome screen and download panel are always black, the logo's own world.

## Colour tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F2EA` warm ivory | `#15120F` rich charcoal | page |
| `--s1` / `--s2` | `#EFE9DD` / `#E7E0D2` | `#1E1A16` / `#28231D` | cards / inputs |
| `--tx` | `#1F1B16` deep charcoal | `#F3EEE4` warm off-white | text |
| `--mu` | `#6B6357` | `#A89F91` | secondary text |
| `--ln` | `#DDD4C3` | `#342E26` | hairlines |
| `--st` | `#E8862A` amber | `#F29A3C` | fills, progress, primary buttons |
| `--sx` | `#A85A00` | `#F5A64E` | amber used as text (meets contrast) |
Themes: system (default), light, dark. The choice persists. Dark mode is not an inversion.

## Typography
Instrument Serif for display and numerals (the numbers are the hero); DM Sans for interface and body; wide-tracked capitals echo the wordmark. Both fonts are bundled (SIL Open Font License), so nothing loads from a third party and the app works offline.

## Motion language
One easing `cubic-bezier(.2,.8,.2,1)`; three durations: 180 ms press, 450 ms state, 900 ms reveal. Signature: the emblem is revealed left to right while one thin amber light trace travels with the edge. On the website a thread of light fills as you scroll (the "trace") and shows the section number. Boot: site once per session, app each cold start, at most about 1.3 s, tap to skip; welcome screen only on first launch. Small branded loader for real waits. Reduced motion makes everything static.

## SPARK Moments
Typography-led 9:16 posters drawn on canvas from real data and exported at 1620×2880: Today, Week, Month, Best day, Streak, Challenge. Each has its own composition and colour blocking and renders in light or dark regardless of the UI theme. The website draws the same designs from clearly labelled demo data.

## Voice
Warm, witty, never guilt-inducing. Notifications are opt-in, respect quiet hours and come in a cheeky or a gentle tone. Estimates are always labelled as estimates.
