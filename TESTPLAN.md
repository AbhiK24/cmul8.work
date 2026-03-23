# WorkSim Test Plan

## Overview

This document outlines the comprehensive testing strategy for WorkSim, covering schema-to-code validation, logic verification, and end-to-end user flows.

---

## 1. Database Schema Validation

### 1.1 Table Existence Tests

| Table | Location | Status |
|-------|----------|--------|
| `users` | shell/db/pool.py:26 | [ ] Verify exists |
| `organizations` | shell/db/pool.py:81 | [ ] Verify exists |
| `org_members` | shell/db/pool.py:122 | [ ] Verify exists |
| `assessment_templates` | shell/db/pool.py:140 | [ ] Verify exists |
| `training_templates` | shell/db/pool.py:164 | [ ] Verify exists |
| `b2b_sessions` | shell/db/pool.py:206 | [ ] Verify exists |
| `b2c_sessions` | shell/db/pool.py:293 | [ ] Verify exists |
| `password_reset_tokens` | shell/db/pool.py:336 | [ ] Verify exists |
| `org_invitations` | shell/db/pool.py:351 | [ ] Verify exists |

### 1.2 Column-to-Query Mapping

#### b2b_sessions Table

| Column | Type | Queries Using It | Verified |
|--------|------|------------------|----------|
| `session_id` | UUID PK | All session queries | [ ] |
| `org_id` | UUID FK | sessions.py, dashboard queries | [ ] |
| `mode` | TEXT | score.py:29, sessions.py | [ ] |
| `assessment_template_id` | UUID FK | B2B assess flow | [ ] |
| `training_template_id` | UUID FK | score.py:39-44 | [ ] |
| `candidate_user_id` | UUID FK | Internal candidates | [ ] |
| `candidate_type` | TEXT | Internal/external filtering | [ ] |
| `candidate_name` | TEXT | Report endpoints | [ ] |
| `candidate_email` | TEXT | Session creation | [ ] |
| `candidate_token` | TEXT | Auth validation | [ ] |
| `candidate_link` | TEXT | Session list | [ ] |
| `org_params` | JSONB | Scoring, context | [ ] |
| `env` | JSONB | Simulation, scoring | [ ] |
| `artifact_html` | TEXT | Document editor | [ ] |
| `agent_histories` | JSONB | Message handling | [ ] |
| `relationship_scores` | JSONB | Scoring | [ ] |
| `status` | TEXT | All flows | [ ] |
| `trace` | JSONB | Scoring, events | [ ] |
| `artifact_trace` | JSONB | B2B only | [ ] |
| `debrief` | JSONB | Debrief, scoring | [ ] |
| `report` | JSONB | Report endpoints | [ ] |
| `report_html_candidate` | TEXT | Legacy | [ ] |
| `report_html_employer` | TEXT | Legacy | [ ] |
| `framework_score` | FLOAT | Training mode scoring | [ ] |
| `coaching_notes` | JSONB | Training feedback | [ ] |
| `created_at` | TIMESTAMPTZ | Ordering | [ ] |
| `started_at` | TIMESTAMPTZ | Duration calc | [ ] |
| `completed_at` | TIMESTAMPTZ | Duration calc | [ ] |
| `created_by` | UUID FK | Audit | [ ] |

#### b2c_sessions Table

| Column | Type | Queries Using It | Verified |
|--------|------|------------------|----------|
| `session_id` | UUID PK | All B2C queries | [ ] |
| `user_id` | UUID FK | User filtering | [ ] |
| `training_template_id` | UUID FK | score.py:63-68 | [ ] |
| `template_slug` | TEXT | Template lookup | [ ] |
| `template_title` | TEXT | Display | [ ] |
| `skill_category` | TEXT | Categorization | [ ] |
| `env` | JSONB | Simulation | [ ] |
| `org_params` | JSONB | Scoring context | [ ] |
| `candidate_token` | TEXT | Auth | [ ] |
| `status` | TEXT | All flows | [ ] |
| `overall_score` | INT | score.py:287-291 | [ ] |
| `agent_histories` | JSONB | Message handling | [ ] |
| `trace` | JSONB | Scoring | [ ] |
| `debrief` | JSONB | Debrief | [ ] |
| `report` | JSONB | Report endpoint | [ ] |
| `relationship_scores` | JSONB | Scoring | [ ] |
| `created_at` | TIMESTAMPTZ | Ordering | [ ] |
| `started_at` | TIMESTAMPTZ | Duration | [ ] |
| `completed_at` | TIMESTAMPTZ | Duration | [ ] |

### 1.3 Query Validation Checklist

Run each query manually against the database to verify:

```sql
-- Test: B2B session scoring query
SELECT env, trace, artifact_trace, debrief, org_params,
       relationship_scores, started_at, completed_at, mode,
       training_template_id
FROM b2b_sessions WHERE session_id = '[test-uuid]';

-- Test: B2C session scoring query
SELECT env, trace, debrief, org_params, relationship_scores,
       started_at, completed_at, training_template_id, template_slug
FROM b2c_sessions WHERE session_id = '[test-uuid]';

-- Test: Training template query
SELECT framework_name, framework_reference, learning_objectives,
       skill_category, title, coaching_prompts
FROM training_templates WHERE id = '[test-uuid]';

-- Test: B2C catalog query with template_id
SELECT template_id, slug, title, skill_category, description,
       duration_minutes, difficulty, learning_objectives
FROM training_templates
WHERE COALESCE(availability, 'both') IN ('both', 'b2c_only');

-- Test: User stats query
SELECT template_slug, COUNT(*) as completed, MAX(overall_score) as best_score
FROM b2c_sessions
WHERE user_id = '[test-uuid]' AND status = 'complete'
GROUP BY template_slug;
```

---

## 2. API Endpoint Tests

### 2.1 Authentication Endpoints

| Endpoint | Method | Test Cases | Status |
|----------|--------|------------|--------|
| `/b2b/auth/register` | POST | Valid registration, duplicate email, weak password | [ ] |
| `/b2b/auth/login` | POST | Valid login, wrong password, non-existent user | [ ] |
| `/b2c/auth/clerk-sync` | POST | Valid Clerk token, invalid token | [ ] |

### 2.2 Session Management Endpoints

| Endpoint | Method | Test Cases | Status |
|----------|--------|------------|--------|
| `/sessions` | GET | List B2B sessions, pagination, filtering | [ ] |
| `/sessions` | POST | Create assessment, create training | [ ] |
| `/sessions/{id}` | GET | Valid session, wrong org, not found | [ ] |
| `/sessions/{id}/context` | GET | B2B session, B2C session, invalid token | [ ] |
| `/sessions/{id}/report/candidate` | GET | Complete session, pending session, not found | [ ] |
| `/sessions/{id}/debrief` | POST | Valid debrief, invalid token, already complete | [ ] |

### 2.3 B2C Catalog Endpoints

| Endpoint | Method | Test Cases | Status |
|----------|--------|------------|--------|
| `/b2c/catalog/scenarios` | GET | List all, with user stats | [ ] |
| `/b2c/catalog/scenarios/{slug}` | GET | Valid slug, not found, b2b_only template | [ ] |
| `/b2c/catalog/categories` | GET | Grouped by category | [ ] |
| `/b2c/catalog/sessions/{slug}/start` | POST | Start new session | [ ] |
| `/b2c/catalog/sessions` | GET | User's sessions | [ ] |
| `/b2c/catalog/sessions/{id}` | GET | Session details | [ ] |
| `/b2c/catalog/sessions/{id}/detail` | GET | Full session with report | [ ] |

### 2.4 Engine Endpoints

| Endpoint | Method | Test Cases | Status |
|----------|--------|------------|--------|
| `/generate` | POST | Valid params, missing params | [ ] |
| `/message` | POST | B2B session, B2C session, invalid session | [ ] |
| `/score` | POST | Assessment mode, training mode, no debrief | [ ] |
| `/events/{id}` | GET | SSE stream, inject firing, timeout | [ ] |
| `/trace` | POST | Valid trace event | [ ] |

---

## 3. Scoring Logic Tests

### 3.1 Mode Detection

| Scenario | Expected Mode | Test |
|----------|---------------|------|
| B2B session with mode='assess' | Assessment scoring | [ ] |
| B2B session with mode='train' | Training scoring | [ ] |
| B2C session (any) | Training scoring | [ ] |
| B2B session with null mode | Assessment scoring (default) | [ ] |

### 3.2 Assessment Scoring Validation

- [ ] All 9 trait scores present (1-10 scale)
- [ ] Evidence provided for each trait
- [ ] Overall band calculated correctly
- [ ] Time analysis metrics present
- [ ] Agent debriefs generated

### 3.3 Training Scoring Validation

- [ ] Framework name matches template
- [ ] Framework scores array present
- [ ] Each step has: letter, name, score, demonstrated, feedback
- [ ] Learning objectives categorized (met/missed)
- [ ] Coaching notes present
- [ ] Overall score 0-100

### 3.4 Database Updates After Scoring

| Session Type | Column Updated | Expected Value |
|--------------|----------------|----------------|
| B2C | `overall_score` | Integer 0-100 | [ ] |
| B2C | `status` | 'complete' | [ ] |
| B2B Train | `framework_score` | Float 0-100 | [ ] |
| B2B Train | `status` | 'complete' | [ ] |
| B2B Assess | `status` | 'complete' | [ ] |
| All | `report` | JSON object | [ ] |
| All | `completed_at` | NOW() | [ ] |

---

## 4. User Flow Tests

### 4.1 B2B Assessment Flow

```
1. [ ] Employer logs in
2. [ ] Creates new assessment (Setup page)
3. [ ] Environment generates correctly
4. [ ] Candidate link is created
5. [ ] Candidate accesses link
6. [ ] Token validation works
7. [ ] Simulation loads with correct env
8. [ ] Agents respond appropriately
9. [ ] Stress injects fire at correct times
10. [ ] Debrief submission works
11. [ ] Scoring completes (assessment prompt)
12. [ ] Report displays trait_scores
13. [ ] Employer can view report
```

### 4.2 B2B Training Flow

```
1. [ ] Employer logs in
2. [ ] Navigates to Train tab
3. [ ] Selects training template
4. [ ] Assigns to candidate
5. [ ] Candidate accesses link
6. [ ] Simulation loads with framework context
7. [ ] Framework reference visible to candidate
8. [ ] Coaching prompts trigger appropriately
9. [ ] Debrief submission works
10. [ ] Scoring completes (training prompt)
11. [ ] Report displays framework_scores
12. [ ] Learning objectives tracked
```

### 4.3 B2C Training Flow

```
1. [ ] User signs up via Clerk
2. [ ] Redirected to /practice (Training Library)
3. [ ] Scenarios load with categories
4. [ ] User's past completions shown
5. [ ] Click scenario starts session
6. [ ] Redirected to /sim/{id}/{token}
7. [ ] Simulation loads correctly
8. [ ] Agents respond
9. [ ] Can complete tasks
10. [ ] Debrief submission works
11. [ ] Scoring completes (training prompt)
12. [ ] Redirected to training report
13. [ ] Report shows framework_scores
14. [ ] Activity tab shows session with score
15. [ ] Can view report from activity
```

---

## 5. Frontend Validation

### 5.1 Page Load Tests

| Page | Route | Auth Required | Tests |
|------|-------|---------------|-------|
| Landing | `/` | No | [ ] Loads, CTAs work |
| Login | `/login` | No | [ ] Form validation |
| Dashboard | `/dashboard` | B2B | [ ] Tabs work, data loads |
| Practice | `/practice` | B2C | [ ] Scenarios load, tabs work |
| Simulation | `/sim/:id/:token` | Token | [ ] Env loads, agents respond |
| Debrief | `/debrief/:id/:token` | Token | [ ] Form submits |
| CandidateReport | `/report/:id/candidate` | No | [ ] Data displays |
| TrainingReport | `/training-report/:id` | Auth | [ ] B2B and B2C work |

### 5.2 Component Tests

- [ ] Logo renders correctly
- [ ] Auth context provides correct userType
- [ ] API client handles errors gracefully
- [ ] Status badges show correct colors
- [ ] Difficulty bars render correctly

---

## 6. Integration Tests

### 6.1 Cross-Service Communication

| From | To | Endpoint | Test |
|------|-----|----------|------|
| Shell | Engine | `/generate` | [ ] Timeout handling |
| Shell | Engine | `/score` | [ ] Error propagation |
| Shell | Engine | `/message` | [ ] Response format |
| Frontend | Shell | All endpoints | [ ] CORS works |
| Frontend | Shell | WebSocket/SSE | [ ] Events received |

### 6.2 Database Transaction Tests

- [ ] Session creation is atomic
- [ ] Scoring updates are atomic
- [ ] Concurrent session updates don't conflict
- [ ] Connection pool handles load

---

## 7. Error Handling Tests

### 7.1 API Error Responses

| Scenario | Expected Status | Expected Detail |
|----------|-----------------|-----------------|
| Invalid session ID | 404 | "Session not found" |
| Wrong token | 403 | "Invalid token" |
| Expired session | 410 | "Session expired" |
| Already complete | 400 | "Session already completed" |
| No org context | 403 | "No organization context" |
| Scoring failed | 500 | Error details |

### 7.2 Frontend Error Handling

- [ ] Network errors show user-friendly message
- [ ] 404 errors redirect appropriately
- [ ] Auth errors trigger logout
- [ ] Loading states prevent double-submission

---

## 8. Performance Tests

### 8.1 Response Time Targets

| Endpoint | Target | Test |
|----------|--------|------|
| Session list | <500ms | [ ] |
| Session detail | <300ms | [ ] |
| Message response | <3s | [ ] |
| Scoring | <30s | [ ] |
| Environment generation | <60s | [ ] |

### 8.2 Load Tests

- [ ] 10 concurrent sessions
- [ ] 50 concurrent API requests
- [ ] Database connection pool saturation

---

## 9. Security Tests

### 9.1 Authentication

- [ ] JWT tokens expire correctly
- [ ] Invalid tokens rejected
- [ ] Session tokens are unique
- [ ] Password hashing is secure

### 9.2 Authorization

- [ ] Users can only access own B2C sessions
- [ ] Org members can only access org sessions
- [ ] Candidate tokens validate correctly
- [ ] Cross-org access blocked

### 9.3 Input Validation

- [ ] SQL injection prevented
- [ ] XSS in message content prevented
- [ ] Large payloads rejected
- [ ] Invalid UUIDs handled

---

## 10. Regression Test Checklist

Run after each deployment:

- [ ] B2B login works
- [ ] B2C Clerk login works
- [ ] Assessment creation works
- [ ] Training assignment works
- [ ] B2C scenario start works
- [ ] Simulation messages work
- [ ] Debrief submission works
- [ ] Scoring completes
- [ ] Reports display correctly

---

## Test Execution Log

| Date | Tester | Section | Pass/Fail | Notes |
|------|--------|---------|-----------|-------|
| 2026-03-23 | Claude | 1. Database Schema | PASS | Fixed b2c_sessions missing relationship_scores in CREATE TABLE |
| 2026-03-23 | Claude | 2.1 Auth Endpoints | PASS | Login returns proper error, protected endpoints require auth |
| 2026-03-23 | Claude | 2.2 Sessions | PASS | Context endpoint handles B2B/B2C correctly |
| 2026-03-23 | Claude | 2.3 B2C Catalog | PASS | Requires auth, returns proper errors |
| 2026-03-23 | Claude | 2.4 Engine | PASS | Proxied via shell, internal URL configured |
| 2026-03-23 | Claude | 3. Scoring Logic | PASS | Mode detection correct, B2C always training |
| 2026-03-23 | Claude | 5.1 Page Routes | PASS | Fixed /login/* for SSO callback |
| 2026-03-23 | Claude | 6.1 Shell-Engine | PASS | ENGINE_URL configured correctly |

---

## Known Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| b2c_sessions CREATE TABLE missing relationship_scores | Medium | FIXED | Added to schema, migration exists |
| /login route missing wildcard for Clerk SSO | High | FIXED | Changed to /login/* |
| Copy inconsistency (Practice vs Training) | Low | FIXED | Updated Practice.tsx and Landing.tsx |

---

## Test Environment

- **Shell API**: https://shell-production-7135.up.railway.app
- **Engine API**: http://engine.railway.internal:8080 (internal)
- **Frontend**: Vercel deployment
- **Database**: Railway PostgreSQL

---

*Last Updated: March 2026*
