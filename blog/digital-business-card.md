# Case Study: A Privacy-First Digital Business Card

*Bridging a physical handshake and a digital identity — without surrendering either to a platform.*

---

## Executive Summary

Professional networking still begins with a physical moment: a conversation, a handshake, a card changing hands. But the paper card is a dead end — static data, no depth, no way to update it once it leaves your hand. The common fix, third-party "smart card" platforms, solves the wrong problem: it hands your professional identity, and your contacts' data, to someone else's analytics pipeline.

This project set out to build the bridge properly. A physical NFC card that, when tapped or scanned, opens a digital identity layer I own end to end: **raquelkehl.ch/card**. One URL on the chip, nothing else. The website remains the single source of truth — contact details can evolve forever without reprinting a single card — and the entire experience runs with zero cookies, zero trackers, zero third-party requests.

The goal was never "a contact page". It was an identity layer that embodies my positioning — *Complex environments. Clear direction.* — in its very architecture: complexity rendered legible, privacy engineered in rather than promised, and a design language that treats restraint as a feature.

## Design Concept and UI/UX

The visual identity grew through thirty design iterations to a locked system built on one deliberate contrast:

**Dark mode is "complex environments".** A deep navy foundation carries a copper circuit-flow system — elbowed pathways that terminate in gold connection nodes, with softly pulsing blue signal points. The circuit layer is not decoration; it is governed by strict spatial rules. Content — contact rows, buttons, the QR code — is treated as solid objects sitting *above* the infrastructure: no trace may cross beneath a component; routes approach closely, then terminate at a node. The identity zone (monogram, name, title) stays circuit-free — complexity begins below it. Warm gold governs every control: luminous icon chips, a glowing outlined call-to-action, and an ivory QR code in a copper frame.

**Light mode is "clear direction".** Deliberately pattern-free porcelain — the absence of the circuit system is itself part of the design language. Where dark mode is warm copper, light mode speaks a cool blue-signal dialect: electric-blue outlined chips and buttons with a soft glow, and a plain navy QR on a porcelain plate. The two modes are not a palette swap; they are two arguments of the same positioning statement.

At the centre sits the RK monogram — angular, interconnected, vector-traced from the approved mark and rendered with ivory letterform cores and a warm gold rim, its glow attached to the letterforms themselves rather than any halo disc. The same mark scales from a 16-pixel favicon to the printed card.

The most theatrical moment is reserved for the exchange itself: triggering the vCard download opens a full-screen "tap moment" — expanding gold ripples around the monogram, a sweeping transmission beam, and a signal panel confirming *Contact received · Verified · Trusted exchange*. The ceremony of a handshake, translated into interface language.

## Tech Stack and Architecture

The stack is deliberately minimal — the discipline *is* the architecture:

- **Astro 5 + TypeScript**, fully static output: no framework runtime ships to the browser at all
- **A custom design-token system** (CSS custom properties) encoding the locked design specification — every colour, glow and geometry traceable to a spec value
- **Self-hosted typography** (Archivo, IBM Plex Mono via Fontsource) — zero requests leave the domain
- **A custom QR generator**: a Node script that renders the brand QR as pure SVG — rounded modules, styled finder patterns, copper frame — from the real URL at the exact 25×25 grid of the approved design, validated against the zxing reference decoder from 400px down to 64px
- **GitHub Pages** behind a custom apex domain, with a two-repository architecture: a private source repository, and a deployment sync that contributes only card-owned paths to the public site — the portfolio and the card coexist on one domain without either touching the other's files
- **The NFC chip itself carries 30 bytes**: a single NDEF URI record, write-locked after programming. No contact data lives on hardware — tap a card printed today, reach the identity of any future day
- **A reproducible print pipeline**: Python-generated press-ready artwork (600 dpi, ISO ID-1 format with bleed) built from the same design tokens and the same vector assets as the website

Privacy is architectural, not cosmetic: the phone number, for instance, exists only as a build-time variable on my machine — never in any repository's history — and the card page is deliberately excluded from search indexing. Like a paper card, it is seen by the people I hand it to.

## Core Features

- **Tap-to-share**: NFC tap or QR scan opens the card directly; the physical layer never needs reprogramming
- **One-tap vCard**: a spec-clean vCard download, staged through the tap-moment confirmation flow — the OS save dialog appears as the *consequence* of choosing "Save contact", mirroring the physical exchange
- **Structured routing**: `/card` as the identity layer, `/privacy` for the data-minimisation notice, a reserved `/book` surface for the next phase — each independently maintainable
- **Dual-theme system** with persistent, cookie-free preference and full keyboard/screen-reader support
- **Verified quality bar**: WCAG AA throughout; Lighthouse 100/100/100/100 on every page

## Future Roadmap

The card is the front door of a growing ecosystem — and the next room is already built:

- **Self-service appointment booking** (`/book`): a privacy-conscious scheduling flow backed by a Node.js + PostgreSQL service that syncs free/busy state with my calendar via CalDAV — exposing available time slots, never calendar contents. The system is code-complete and verified in private testing: double-booking is made impossible at the database level (temporal exclusion constraints, not just application checks), appointment types and working hours live as data rather than code, and the entire stack runs locally in mock mode without a single credential. Same design system, same zero-tracker discipline — launching once the Swiss hosting is provisioned.
- **Meeting integrations** (Teams, Zoom, Google Meet) layered behind the booking service
- **Deeper physical-digital touchpoints** — the design system already extends to print, email signature and social artwork generated from a single source of truth, and it is built to keep extending

The quiet thesis of the project: the more digital our professional lives become, the more the physical moment matters — and the bridge between them deserves the same architectural rigour as any enterprise system.

---

*Built with Astro, TypeScript and an uncompromising definition of "privacy-first". No cookies, no trackers, no analytics — verified.*
