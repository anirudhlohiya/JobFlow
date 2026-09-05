# Business Case

**Last updated:** September 2026

---

## 1. Idea Assessment (25-Year Industry Veteran View)

### Ratings

| Parameter | Score (1–10) | Notes |
|---|---|---|
| **Problem severity** | 8.0 | Real pain, felt daily by millions of job seekers |
| **Market size** | 7.0 | Millions of Indian IT job seekers; massive WhatsApp group ecosystem |
| **Willingness to pay** | 5.0 | Students/freshers are price-sensitive; ₹199–499/mo realistic |
| **Competition** | 3.0 | Brutally crowded (15+ SaaS + 10+ open-source) |
| **Differentiation** | 6.5 | WhatsApp-image → email workflow genuinely unserved |
| **Technical feasibility** | 8.5 | All components proven; LaTeX compile is only tricky part |
| **Moat / defensibility** | 3.0 | Open-source = no moat. Speed + community = substitute |
| **Business model clarity** | 4.0 | Free code ≠ revenue; needs hosted SaaS pivot |
| **Deliverability/legal risk** | 4.0 | 50 cold emails/day from personal Gmail is risky |
| **Time to MVP** | 8.0 | 3–4 weeks for personal-use v1 |
| **Overall** | **5.7** | **→ 7.5 with repositioning** (see recommendations) |

### Verdict
**Build it.** Worst case: you automate your own job hunt (real immediate value). Best case: you've seeded a niche SaaS with a genuine wedge. The WhatsApp-to-interview pipeline is an underserved niche.

---

## 2. Revenue Models

### Option A: Free Core → Hosted SaaS (Recommended)

| Phase | Model | Revenue |
|---|---|---|
| Phase 1–2 | Open-source code distribution | $0 (builds audience) |
| Phase 3+ | Hosted SaaS with managed Gmail + templates | ₹299–599/mo ($4–8/mo) |

**Why:** Open-source builds trust and distribution. Hosted version removes setup friction (non-technical users can't install Node.js). The hosted version is the revenue engine.

**Advantages:** No piracy risk, recurring revenue, easy to scale
**Disadvantages:** Requires infrastructure, more complex to build

### Option B: Freemium with Paid Templates

| Tier | Price | Includes |
|---|---|---|
| Free | ₹0 | Core app, basic templates, 20 apps/month |
| Pro | ₹199/mo | Unlimited apps, premium templates, cold outreach, priority support |
| Team | ₹499/mo | 3 seats, shared templates, analytics |

**Why:** Templates and cold-outreach are premium features. Core tailoring is free to build habit.

**Advantages:** Low barrier, clear upgrade path
**Disadvantages:** Free users may never convert

### Option C: One-Time License + Updates

| License | Price | Includes |
|---|---|---|
| Personal | ₹999 (one-time) | Perpetual license, 1 year updates |
| Professional | ₹2,499 (one-time) | Commercial use, 2 years updates |

**Why:** Appeals to one-time buyers. LazyApply charges $99–999/year.

**Advantages:** Simple, no subscription fatigue
**Disadvantages:** No recurring revenue, piracy risk, must keep selling

### Recommended: Start with Option A, validate with Option B

---

## 3. Pricing Strategy

### India-Focused (Phase 1–2)
| Plan | Price | Positioning |
|---|---|---|
| Starter | ₹0 (free, self-hosted) | Open-source, DIY setup |
| Pro | ₹199/mo | Hosted, managed Gmail, premium templates |
| Power | ₹499/mo | Cold outreach, batch mode, analytics |

### Global (Phase 3+)
| Plan | Price | Positioning |
|---|---|---|
| Starter | $0 (free, self-hosted) | Open-source |
| Pro | $4.99/mo | Hosted version |
| Team | $12.99/mo | Multi-seat, shared workspace |

### Why these prices:
- Indian fresher monthly budget for tools: ₹200–500
- Global comparison: Jobright $19/mo, Teal $29/mo, AI Applyd $38.99/mo
- Our advantage: self-hosted option is free forever (no one else offers this)

---

## 4. Go-to-Market Strategy

### Phase 1: Build in Public (Weeks 1–4)
1. Build personal-use v1
2. Use it daily for your own job search
3. Post daily progress on LinkedIn/Twitter/Reddit
4. Share results: "Applied to 30 jobs in one week using my tool"
5. GitHub repo goes live with stars as social proof

### Phase 2: Community Seeding (Weeks 5–8)
1. Share in WhatsApp job groups (your target users are IN these groups)
2. Post on Reddit: r/csMajors, r/jobs, r/India (if allowed)
3. Post on LinkedIn with a demo video
4. Reach out to job-search YouTubers for features
5. Collect feedback from first 20 users

### Phase 3: Monetize (Months 3–6)
1. Launch hosted SaaS version
2. Add Stripe/Razorpay payments
3. Premium templates, cold-outreach module
4. Content marketing: "How I got 15 interviews in 30 days"

### Distribution Channels
| Channel | Why it works |
|---|---|
| **WhatsApp groups** | Your users are ALREADY here; share a demo video |
| **LinkedIn** | Job seekers actively post about their search; organic reach |
| **GitHub** | Open-source builds trust; stars = social proof |
| **Reddit** | r/csMajors (100K+), r/jobs, r/cscareerquestions |
| **YouTube** | Demo video of "screenshot → email sent in 30 seconds" |
| **College groups** | Freshers are the largest segment; campus WhatsApp groups |

---

## 5. Unit Economics (Hosted SaaS)

### Cost per User (Monthly)
| Item | Cost |
|---|---|
| LLM API calls (30 apps/mo) | ~₹150 ($1.80) |
| Hosting (Vercel/Railway) | ~₹50 ($0.60) |
| Email sending (Gmail API) | $0 (user's Gmail) |
| Support | ~₹30 ($0.36) |
| **Total cost** | **~₹230 ($2.76)** |

### Revenue per User (Monthly)
| Plan | Revenue | Margin |
|---|---|---|
| Pro (₹199/mo) | ₹199 | -₹31 (negative at low volume) |
| Power (₹499/mo) | ₹499 | +₹269 (54% margin) |

### Break-Even Analysis
- At 100 Pro users: ₹19,900 revenue vs ₹23,000 costs → loss
- At 500 Pro users: ₹99,500 revenue vs ₹115,000 costs → loss
- At 100 Power users: ₹49,900 revenue vs ₹23,000 costs → profit
- **Realistic path:** 100 free users → 20 Pro → 10 Power = ₹13,980/mo revenue

### Key Insight
The self-hosted (free) version costs you nothing. Every user who installs it and loves it becomes a potential paying customer for the hosted version. The LLM cost is the main variable — users pay their own API keys in self-hosted mode (zero cost to you).

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Low conversion to paid | High | Strong free tier builds habit; hosted version adds clear value |
| Gmail account bans from cold outreach | High | Built-in safety rails; warmup schedule; user education |
| Copycats / forks | Medium | Speed + community + template quality = competitive edge |
| Google OAuth verification delays | Medium | Start verification early; personal use works without it |
| Market saturated perception | Medium | Niche positioning: "WhatsApp workflow" not "auto-apply" |
| Legal compliance (CAN-SPAM, DPDP) | Medium | Unsubscribe option; consent tracking; legal docs in templates |

---

## 7. Success Criteria

| Milestone | Target | Timeline |
|---|---|---|
| Personal use: 10+ apps/day | Automated job hunt | Week 3 |
| GitHub: 100+ stars | Community validation | Week 8 |
| First paying customer | Revenue validation | Month 3 |
| 100 active users | Product-market fit signal | Month 6 |
| ₹50K MRR | Sustainable business | Month 12 |

---

## 8. Senior Assessment Summary

> **"Does this idea work?"**
>
> The generic version — auto-apply to jobs with AI — is saturated. But the specific workflow you're building (WhatsApp screenshot → email to HR → follow-up) is genuinely underserved. The Indian IT job market operates on WhatsApp groups and email applications. No existing tool serves this. That's a real wedge.
>
> The cold-outreach feature needs careful implementation — 50 cold emails/day from a personal Gmail WILL get flagged without proper warmup. Build safety rails from day one, not as an afterthought.
>
> The code-distribution model has no revenue path by itself. Plan the hosted SaaS version early. The free version is your marketing engine; the hosted version is your business.
>
> **Rating: 5.7/10 as-is → 7.5/10 with repositioning.** Build it for yourself first. If it saves you 2 hours/day on job applications, it'll save others too.
