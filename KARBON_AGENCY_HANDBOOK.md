# Karbon Agency — Internal Operations Handbook

**Company:** TheLevelTeam LLC, DBA Karbon Agency
**Website:** https://karbonagency.com
**Phone:** (866) 996-6382 / (866) 996-META
**Email:** support@karbonagency.com
**Founded:** 2025

---

## 1. COMPANY OVERVIEW

Karbon Agency is a specialized digital marketing agency that **exclusively** serves the sim racing industry. We offer Meta (Facebook) and Instagram advertising services designed to fill seats at sim racing venues, F1 experience centers, drift simulation arcades, and motorsport entertainment businesses.

**Legal Entity:** TheLevelTeam LLC
**DBA:** Karbon Agency

### Mission Statement
We fill sim racing seats. That's all we do.

### Core Value Proposition
- The **only** agency exclusively serving the sim racing industry
- Meta & Instagram advertising specialists
- Hyper-targeted campaigns for racing venues
- Proven results with data-driven optimization

---

## 2. BRAND IDENTITY

### Tagline
**"We Fill Sim Racing Seats. That's All We Do."**

### Brand Voice
- Direct, confident, no-nonsense
- Industry-specific language — we speak sim racing
- Results-focused — always lead with data
- High-energy, motorsport-inspired

### Visual Identity
- **Primary Color:** Red (#ef4444) to Orange (#f97316) gradient
- **Background:** Black (#000000)
- **Text:** White with varying opacity levels
- **Logo:** Hexagonal icon with "K" letterform + "KARBON AGENCY" wordmark
- **Font:** Inter (Google Fonts)

### Logo Usage
- Full logo: Hexagonal K icon + "KARBON AGENCY" text
- Icon only: Hexagonal K (for favicons, small spaces)
- Available sizes: Small, Medium, Large
- Logo files: `/public/karbon-logo.svg` (full), `/public/karbon-icon.svg` (icon only)

---

## 3. SERVICES & OFFERINGS

### What We Do
1. **Hyper-Targeted Ads** — We build audiences of motorsport fans, gamers, car enthusiasts, corporate planners, birthday party parents, and thrill-seekers within your venue's radius
2. **Creative That Converts** — High-energy video ads, carousel sequences, and story content designed specifically for the sim racing experience
3. **Seats Filled. Period.** — Full-funnel campaigns from awareness to booking, every ad dollar tracked and optimized weekly

### How It Works (3-Step Process)
1. **Free Strategy Call** — 30-minute consultation to audit current ads, build custom strategy, project ROI
2. **Custom Campaign Build** — We design and launch your Meta & Instagram ad campaigns
3. **Launch & Optimize** — Weekly optimization, monthly reporting, continuous improvement

### Key Differentiators
1. **100% Sim Racing Focus** — Not one of 50 industries we serve
2. **Audience Expertise** — We understand motorsport fans, gamers, corporate planners, car enthusiasts
3. **Creative Excellence** — High-energy video ads, carousel sequences, story content
4. **Full Funnel Approach** — Awareness to booking conversion
5. **Data-Driven** — Weekly optimization, monthly reporting, every dollar tracked

---

## 4. TARGET MARKET

### Venue Types We Serve
- Sim Racing Venues
- F1 Simulator Experiences
- Drift Simulation Centers
- Racing Arcade Lounges
- iRacing Centers
- Motorsport Entertainment Venues
- Virtual Racing Facilities
- Esports Racing Venues
- Corporate Racing Events
- NASCAR Simulator Centers
- GT Racing Experiences
- Rally Simulation Arcades
- IndyCar Simulator Venues
- Racing Birthday Parties
- Karting & Sim Combos
- Multi-Rig Racing Centers

### Target Audiences (Who We Reach for Clients)
- Motorsport fans
- Gamers and esports enthusiasts
- Car enthusiasts
- Corporate event planners
- Birthday party parents
- Thrill-seekers
- Date night couples
- Team building organizers

---

## 5. PROVEN RESULTS & CAMPAIGN DATA

### Key Performance Metrics
| Metric | Value |
|--------|-------|
| Average Cost Per Booking | $5.03 |
| Total Impressions | 7.7M+ |
| Total Bookings Generated | 20,600+ |
| Total Ad Spend Managed | $104K+ |

### Campaign Benchmarks
- **Cost Per Booking Target:** ~$5 CPB
- **Platform Focus:** Meta (Facebook) + Instagram
- **Campaign Types:** Awareness, Traffic, Conversions, Booking
- **Optimization Cadence:** Weekly
- **Reporting Cadence:** Monthly

### Ad Creative Types
- High-energy video ads showcasing the sim racing experience
- Carousel sequences highlighting multiple rigs/experiences
- Story content (vertical format for Instagram/Facebook Stories)
- Static image ads with strong CTAs
- Before/after content showing venue transformations

### Common Pain Points We Solve
1. **"We tried Instagram ads and they flopped"** — Generic targeting wastes budget; we use motorsport-specific audiences
2. **"Our agency doesn't get our business"** — General agencies don't understand the sim racing niche
3. **"We're overbooked on weekends but dead on weekdays"** — We run campaigns targeting specific time slots
4. **"We have no idea what's actually working"** — Full tracking from impression to booking

---

## 6. WEBSITE STRUCTURE

### Pages
| URL | Purpose |
|-----|---------|
| `/` | Homepage — full marketing site with all sections |
| `/contact` | Contact form for "Request More Info" leads |
| `/book` | Calendar booking for free strategy calls |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

### Homepage Sections (in order)
1. Navbar (fixed) with logo + CTA
2. Hero — main tagline + dual CTAs
3. Pain Points — 4 common problems we solve
4. What We Do — 3 service pillars
5. Why Us / Proof — 4 stat cards
6. Results — real campaign metrics + screenshot
7. How It Works — 3-step process
8. Final CTA — booking push
9. SEO Content — venue types + long-form copy
10. Footer — links, phone, copyright

### Key CTAs
- **Primary:** "Start Your Ads Now" → /book
- **Secondary:** "Request More Info" → /contact
- **Navbar:** "Book a Free Call" → /book
- **Phone:** (866) 996-META

---

## 7. LEAD CAPTURE & CRM

### Contact Form Fields
- Name (required)
- Company / Venue Name (optional)
- Phone (required)
- Email (required)
- Message (required) — prompted with: "Tell us about your sim racing business — how many rigs, current marketing, goals..."
- SMS Consent checkbox (optional)

### Calendar Booking
- Embedded GoHighLevel calendar widget
- Calendar ID: F28UtidAQzcdYXYIm7wb
- 30-minute free strategy call format

### Lead Flow
1. Lead submits form on /contact OR books call on /book
2. Contact saved to Supabase database
3. Contact pushed to GoHighLevel CRM
4. GHL workflow triggers:
   - **Form submissions:** "Karbon Web Lead Nurture Drip" workflow fires
   - **Calendar bookings:** "Karbon Booking Slack Notify" workflow fires
5. Slack notification sent to #general-chat in ArtofSims Corporation workspace

---

## 8. AUTOMATED WORKFLOWS (GoHighLevel)

### Workflow 1: Karbon Web Lead Nurture Drip
**Trigger:** Contact Created (form submission)
**Status:** Published

**Flow:**
1. Trigger: Contact Created
2. **Notify Slack - New Lead** → Sends notification to #general-chat
3. Create Opportunity (Karbon-Web-Lead pipeline)
4. Welcome Email
5. Welcome SMS
6. Wait 1 Day for Reply
7. If/Else: Did the contact reply?
   - **Yes branch:** Follow-up actions
   - **No branch:** Continued drip sequence (Booking Link SMS, Survey Link SMS, Voicemail, Any Questions SMS)

**Slack Notification Message:**
```
🚨 *New Karbon Agency Lead!*

Name: {{contact.name}}
Email: {{contact.email}}
Phone: {{contact.phone}}
Source: {{contact.source}}

Check GHL for details and follow up!
```

### Workflow 2: Karbon Booking Slack Notify
**Trigger:** Appointment Status = confirmed
**Status:** Published

**Flow:**
1. Trigger: Appointment Status (confirmed)
2. **Notify Slack - Booking Confirmed** → Sends notification to #general-chat

**Slack Notification Message:**
```
📅 *New Strategy Call Booked!*

Name: {{contact.name}}
Email: {{contact.email}}
Phone: {{contact.phone}}

Check GHL calendar for details!
```

---

## 9. SMS MESSAGING PROGRAM

### Compliance
- **10DLC Registered:** Campaign registered for SMS compliance
- **Opt-in Method:** Website form with optional SMS consent checkbox
- **Opt-out:** Reply STOP, UNSUBSCRIBE, or CANCEL at any time
- **Help:** Reply HELP for assistance
- **Message Frequency:** Approximately 2-5 messages per month
- **Age Requirement:** 18+
- **Consent Disclosure:** "Consent is not a condition of purchase"

### SMS Message Types
- Appointment confirmations and reminders
- Follow-up messages regarding inquiries
- Booking links and scheduling information
- Responses to questions about services
- Service updates and promotional information

### SMS Keywords
| Keyword | Action |
|---------|--------|
| STOP | Opt out of all SMS |
| UNSUBSCRIBE | Opt out of all SMS |
| CANCEL | Opt out of all SMS |
| HELP | Receive support contact info |

---

## 10. TECH STACK

### Website
- **Framework:** Next.js 16.1.6 (App Router)
- **UI Library:** React 19.2.3
- **Styling:** TailwindCSS 4 with PostCSS
- **Language:** TypeScript 5
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Repository:** https://github.com/sevakogan/karbonagency

### Third-Party Integrations
| Service | Purpose |
|---------|---------|
| GoHighLevel (GHL) | CRM, calendar booking, workflows, SMS, email |
| Supabase | Database for contact form submissions |
| Slack | Team notifications (ArtofSims Corporation workspace) |
| Vercel | Website hosting and deployment |
| GitHub | Source code repository |
| Google Fonts | Inter font family |

### GHL Configuration
- **Location ID:** wJLKw5PFRkJWgXFikehr
- **Calendar ID:** F28UtidAQzcdYXYIm7wb
- **API Key:** pit-951e1e29-922e-493d-8ec8-4e3c101fa1f7
- **Phone Number:** +1 866-996-3824

### Slack Integration
- **Workspace:** ArtofSims Corporation
- **Connected via:** LeadConnector app (GHL)
- **Notification Channel:** #general-chat

---

## 11. SEO & METADATA

### Primary Keywords
sim racing marketing, sim racing ads, Meta ads sim racing, Instagram ads racing simulator, F1 simulator marketing, drift simulation advertising, motorsport entertainment marketing, racing venue advertising, sim racing lead generation, esports racing marketing

### Full Keyword List
sim racing marketing, sim racing ads, sim racing advertising, Meta ads for sim racing, Instagram ads for sim racing, Facebook ads racing simulator, sim racing business marketing, racing simulator advertising, F1 simulator marketing, drift simulation advertising, motorsport entertainment marketing, sim racing venue advertising, racing arcade marketing, virtual racing marketing, sim racing lead generation, racing experience advertising, sim racing social media marketing, sim racing digital marketing, esports racing marketing, racing entertainment advertising, iRacing venue marketing, racing simulator venue ads, sim racing Meta advertising, sim racing Instagram marketing, racing venue Facebook ads, sim racing business growth, motorsport venue marketing, racing simulator promotion, sim racing customer acquisition, racing entertainment digital ads, racing simulator social media, sim racing paid advertising, virtual motorsport marketing, sim racing venue promotion, racing experience digital marketing, sim racing campaign management, motorsport digital advertising, racing simulator Meta ads, sim racing ROI, sim racing cost per booking, racing venue lead generation, F1 experience marketing, drift simulator promotion, NASCAR simulator advertising

### Structured Data (JSON-LD)
- Organization schema
- WebSite schema
- WebPage schema
- Service schema (3 service offers)
- FAQPage schema (4 Q&As)

### FAQ Content
1. **What is Karbon Agency?** — Specialized marketing agency for sim racing businesses using Meta & Instagram ads
2. **What types of businesses do you work with?** — All sim racing venues from single-rig to multi-venue operations
3. **How do Meta & Instagram ads work for sim racing?** — Targeted campaigns reaching motorsport fans, gamers, car enthusiasts within venue radius
4. **Why choose a specialized agency?** — Generic agencies spread across industries; we know sim racing audiences, booking patterns, and what creative converts

---

## 12. LEGAL & COMPLIANCE

### Privacy Policy (karbonagency.com/privacy)
- Data collection: name, email, phone, company, message
- SMS consent and messaging terms
- Cookie & tracking disclosure (essential, analytics, GHL third-party)
- No selling/sharing of personal data
- User rights to access, update, delete data

### Terms of Service (karbonagency.com/terms)
- SMS use cases and message frequency
- Opt-out instructions (STOP, UNSUBSCRIBE, CANCEL, phone, email)
- Customer support contact information
- Message & data rate disclosure
- Carrier liability disclaimer
- Age restriction (18+)
- Privacy policy reference

### 10DLC Campaign Registration
- **Campaign Use Case:** Low Volume Mixed
- **Opt-in Method:** Website form
- **Opt-in Form URL:** https://karbonagency.com/contact

---

## 13. AD CAMPAIGN BEST PRACTICES

### Platform Strategy
- **Primary Platform:** Meta (Facebook + Instagram)
- **Campaign Objectives:** Conversions (bookings), Traffic, Awareness
- **Budget Approach:** Start small, scale what works
- **Optimization:** Weekly adjustments based on performance data

### Audience Targeting
- **Geographic:** Radius around venue location
- **Interest-based:** Motorsport, racing, gaming, car enthusiasts, sim racing
- **Behavioral:** Event-goers, experience seekers, entertainment spenders
- **Lookalike:** Based on existing bookers/customers
- **Custom:** Retargeting website visitors, form submitters

### Creative Best Practices
1. **Video First** — Show the experience, the excitement, the rigs in action
2. **Mobile-Optimized** — Vertical (9:16) for Stories/Reels, Square (1:1) for Feed
3. **Strong Hook** — First 3 seconds must grab attention
4. **Clear CTA** — "Book Now," "Reserve Your Seat," "Try It Today"
5. **Social Proof** — Show real people having fun, reviews, packed venues
6. **Urgency** — Limited slots, weekend bookings filling fast

### Campaign Structure
1. **Top of Funnel (Awareness):** Video views, reach campaigns to build awareness
2. **Middle of Funnel (Consideration):** Traffic to website, engagement with content
3. **Bottom of Funnel (Conversion):** Booking campaigns, retargeting warm audiences
4. **Retention:** Retarget past bookers for return visits, special events

### Key Metrics to Track
| Metric | Target | Notes |
|--------|--------|-------|
| Cost Per Booking (CPB) | ~$5 | Primary KPI |
| Click-Through Rate (CTR) | >1.5% | Ad relevance indicator |
| Conversion Rate | >5% | Landing page effectiveness |
| Return on Ad Spend (ROAS) | >5x | Revenue vs ad spend |
| Frequency | <3 | Avoid ad fatigue |
| Impressions | Monitor | Reach indicator |

### Common Campaign Mistakes to Avoid
1. Targeting too broad — always geo-fence around the venue
2. Using generic stock photos — real venue footage converts better
3. Running only one ad — always A/B test creative
4. Setting and forgetting — weekly optimization is essential
5. No tracking — always set up conversion tracking before launching
6. Ignoring weekday opportunities — most venues are dead Mon-Thu, target those slots

---

## 14. COMMUNICATION TEMPLATES

### Welcome Email (GHL Workflow)
Subject: Welcome to Karbon Agency
Content: Introduction, what to expect, next steps for strategy call

### Welcome SMS
Brief text confirming receipt of inquiry with booking link

### Follow-up Sequence
1. Day 1: Welcome email + SMS
2. Day 2: Booking link SMS (if no reply)
3. Day 3: Survey link SMS
4. Day 4: Voicemail drop
5. Day 5: "Any Questions?" SMS

---

## 15. DEPLOYMENT & DEVELOPMENT

### Development Commands
```bash
npm run dev    # Start development server
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

### Deployment
- Push to `main` branch on GitHub
- Vercel auto-deploys from GitHub
- Build output is static + serverless functions

### Project Structure
```
src/
├── app/
│   ├── api/contact/route.ts    # Contact form API
│   ├── book/
│   │   ├── page.tsx             # Booking page
│   │   └── calendar-embed.tsx   # GHL calendar widget
│   ├── contact/
│   │   ├── page.tsx             # Contact page
│   │   └── contact-form.tsx     # Form component
│   ├── privacy/page.tsx         # Privacy Policy
│   ├── terms/page.tsx           # Terms of Service
│   ├── layout.tsx               # Root layout + metadata
│   ├── globals.css              # Global styles + animations
│   ├── page.tsx                 # Homepage
│   └── sitemap.ts               # XML sitemap
├── components/
│   ├── logo.tsx                 # Karbon logo component
│   └── parallax-section.tsx     # Scroll parallax effect
├── lib/                         # Utility functions
└── public/
    ├── karbon-logo.svg          # Full logo SVG
    └── karbon-icon.svg          # Icon-only SVG
```

---

*This document is maintained by the Karbon Agency team. Last updated: February 2026.*
