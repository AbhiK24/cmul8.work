# CMUL8.WORK Development Roadmap

## Current State
- Core simulation engine with Kimi 2.5
- Employer dashboard with session management
- Candidate simulation experience (inbox, tasks, artifact, agents)
- Report generation with behavioral scoring
- DiceBear avatars for agents

---

## Focus 1: Core Simulation Experience & Efficacy

### Goals
- Make simulations feel more realistic and immersive
- Improve signal quality for behavioral assessment
- Reduce candidate confusion, increase engagement

### Ideas
- [ ] **Richer agent personalities** - More nuanced responses based on relationship history
- [ ] **Dynamic difficulty** - Adjust pressure based on candidate performance
- [ ] **Better inject timing** - Smarter stress injection based on candidate state
- [ ] **Thread prioritization signals** - Visual cues for urgency/importance
- [ ] **Task dependencies** - Some tasks unlock after others complete
- [ ] **Agent mood indicators** - Show if agent is frustrated/pleased
- [ ] **Time pressure mechanics** - Countdown timers, deadline reminders
- [ ] **Artifact collaboration** - Agents can suggest edits, mark sections
- [ ] **Multi-channel comms** - Slack-style channels vs DMs
- [ ] **Meeting requests** - Agents can request sync calls (simulated)

### Metrics to Track
- Session completion rate
- Time to first response
- Engagement depth (messages sent, tasks completed)
- Report accuracy (if we get feedback)

---

## Focus 2: Test vs Train Environments

### Current: TEST Mode
- Assess existing qualities/skills
- Score and report on behavioral traits
- Used for hiring decisions

### New: TRAIN Mode
- Impart new micro-skills relevant to org
- Guided learning within simulation
- Test acquisition of new skills post-training

### Implementation Ideas
- [ ] **Mode selector** when creating WorkSim (test/train/hybrid)
- [ ] **Learning objectives** - Define what skills to teach
- [ ] **Coaching agents** - Special agent type that guides/teaches
- [ ] **Feedback loops** - Real-time hints when candidate struggles
- [ ] **Skill modules** - Reusable training content (e.g., "Difficult Conversations", "Prioritization Framework")
- [ ] **Pre/Post assessment** - Measure skill delta
- [ ] **Scenario library** - Pre-built training scenarios per skill
- [ ] **Progress tracking** - Multi-session skill development

### Use Cases
- New hire onboarding
- Leadership development
- Sales training
- Customer success training
- Conflict resolution practice

---

## ~~Focus 3: WorkSim Onboarding~~ ✅ IMPLEMENTED

### ~~Problem~~
~~Candidates drop into simulation without full context of:~~
- ~~Their role in the scenario~~
- ~~Company/team background~~
- ~~What's expected of them~~
- ~~How to navigate the interface~~

### ~~Solution: Pre-Simulation Onboarding Flow~~

- [x] ~~**Context briefing screen** before simulation starts~~
- [x] ~~**"Day in the life" brief**~~
- [x] ~~**Character cards** - Meet your team~~
- [ ] **Interactive tutorial** (first-time users) - *deferred*

### ~~UX Flow~~
```
Landing → Onboarding (3-5 min) → Simulation → Debrief → Report ✓
```

---

## Focus 4: Deep Analysis & Traces

### Current
- Basic report with trait scores
- Agent debriefs
- Key observations

### Enhanced Analytics

- [ ] **Conversation timeline** - Visual playback of entire session
- [ ] **Decision tree analysis** - What choices candidate made, alternatives
- [ ] **Response pattern analysis**
  - Time to respond per agent
  - Message length patterns
  - Tone analysis over time

- [ ] **Agent relationship graph** - How relationships evolved
- [ ] **Task completion analysis**
  - Which tasks prioritized
  - Time spent per task
  - Completion quality

- [ ] **Behavioral heatmap** - Activity patterns across session
- [ ] **Comparison views** - Compare candidate to role benchmarks
- [ ] **Quote extraction** - Highlight notable candidate messages
- [ ] **Video-style replay** - Step through simulation like a recording

### Employer Dashboard Enhancements
- [ ] **Cohort analysis** - Compare across candidates
- [ ] **Role benchmarking** - Internal vs external performance
- [ ] **Trait correlation** - Which traits predict success
- [ ] **Red flag detection** - Automatic flagging of concerns

---

## Focus 5: Independent User (B2C) Flow

### Vision
Allow individuals (not via employers) to:
- Practice interview skills
- Prepare for new roles
- Build soft skills
- Get certified assessments

### Landing Page Expansion
- [ ] **Dual CTA**: "For Employers" | "For Individuals"
- [ ] **Individual value prop**: "Practice before your next interview"
- [ ] **Skill categories**: Interview prep, Leadership, Communication, etc.
- [ ] **Pricing**: Free tier + premium

### Individual Auth Flow
- [ ] **Sign up** (email/Google/LinkedIn)
- [ ] **Onboarding quiz** - What are you preparing for?
- [ ] **Skill assessment** - Quick baseline test
- [ ] **Recommended WorkSims** - Personalized suggestions
- [ ] **Progress dashboard** - Track skill development

### B2C Product Features
- [ ] **Interview Prep Mode**
  - PM interview sim
  - Consulting case sim
  - Behavioral interview sim

- [ ] **Skill Tracks**
  - "Difficult Conversations" (5 sims)
  - "Stakeholder Management" (4 sims)
  - "Time Under Pressure" (3 sims)

- [ ] **Certificates** - Shareable completion badges
- [ ] **Leaderboards** - Gamification (optional)
- [ ] **Community** - Share experiences, tips

### Monetization
- Free: 1-2 practice sims
- Pro ($X/mo): Unlimited sims, detailed reports
- Enterprise: Current B2B model

---

## Technical Debt & Infrastructure

- [ ] Add comprehensive error handling
- [ ] Implement proper logging/monitoring
- [ ] Add rate limiting
- [ ] Set up staging environment
- [ ] Write tests (unit, integration, e2e)
- [ ] Database migrations system
- [ ] API documentation
- [ ] Performance optimization (caching, lazy loading)

---

## Priority Order (Suggested)

1. ~~**Focus 3: Onboarding**~~ ✅ Done
2. **Focus 1: Core Experience** - Foundation for everything else
3. **Focus 4: Analytics** - Differentiation, employer value
4. **Focus 5: B2C** - New revenue stream, growth
5. **Focus 2: Train Mode** - Expansion into L&D market

---

## Notes & Ideas Parking Lot

- Voice/video simulation (future)
- Mobile app
- Slack/Teams integration for delivery
- AI interviewer mode
- Custom scenario builder for employers
- API for third-party integrations
- Multi-language support
- Accessibility improvements

---

*Last updated: March 2026*
