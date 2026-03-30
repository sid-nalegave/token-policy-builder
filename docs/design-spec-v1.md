# Token Policy
## Spec v1

---

## What it is

A guided assessment tool for IAM practitioners. Takes structured inputs describing an application's context and requirements. Produces a specific, defensible token and session policy recommendation grounded in current standards.

No login. No backend. No data leaves the browser.

---

## URL
`token-policy.nalegave.com`

---

## Design system
Visual design, tokens, typography, and component patterns are defined in `DESIGN.md` in the shared context folder. All UI decisions follow that reference.

---

## Start state

The first input renders on load. One line of framing appears above it — not a hero, not a subhead. Exactly this:

> "A token and session policy grounded in current standards. No login, no data leaves your browser."

Below that, the first question and its options. Nothing else.

---

## User flow

1. First input renders on load with single framing line above it
2. User moves through inputs sequentially, one at a time
3. M2M fast path: if App type = M2M, steps 2 (user population) and 6 (idle session behavior) are skipped — shown as greyed-out in the stepper with the label "Not applicable — no user session"
4. Result card renders on completion
5. User can copy, export as JSON, share, or start over
6. Result is bookmarkable via shareable URL — state encoded in query params, no backend required

---

## Inputs

Each input is a single-select choice. Presented one at a time. User can go back.

| # | Field | Options | Notes |
|---|---|---|---|
| 1 | App type | SPA · Server-rendered · Mobile (native) · M2M | M2M triggers fast path |
| 2 | User population | Employees · Consumers · Partners · No users (M2M) | Skipped for M2M |
| 3 | Sensitivity tier | Low · Medium · High | Inline option descriptions — see tooltips section |
| 4 | Compliance framework | None · SOC 2 · HIPAA · FedRAMP Moderate · FedRAMP High | |
| 5 | Refresh token usage | Yes · No | M2M skips this step |
| 6 | Idle session behavior | Sliding window · Fixed expiry · Not applicable | Skipped for M2M |
| 7 | Token binding | None · DPoP · mTLS | |

---

## Progress indicator

A horizontal stepper rendered above each input. Shows all steps by name so the user sees the full scope upfront and knows it's a short flow. Skipped steps (M2M fast path) are visible but greyed-out with a "Not applicable" label — not hidden. This makes the skip feel intentional rather than a bug.

---

## Input tooltips

Every input step has a visible `?` icon next to the question label. Click or tap reveals the tooltip. Same interaction, same position on every step.

Sensitivity tier is the only exception — one-line descriptions are shown inline beneath each option in addition to the `?` icon.

Copy follows voice.md tooltip rules: complete sentence, no "This is", no filler.

**App type**
> The runtime architecture of the application. Determines client type (public vs confidential), available grant flows, and token storage constraints.

**User population**
> Who authenticates with this application. Affects session duration expectations, re-auth tolerance, and compliance applicability.

**Sensitivity tier**
> How sensitive is the data this app accesses or processes.

Inline option descriptions (always visible):
- Low — General productivity. No regulated data. No PII.
- Medium — Business-sensitive data or PII. Not subject to strict compliance requirements.
- High — Financial data, PHI, privileged access, or systems subject to FedRAMP or HIPAA.

**Compliance framework**
> The regulatory or certification framework your application must satisfy. Drives specific timeout values, token storage constraints, and required controls.

**Refresh token usage**
> Refresh tokens allow clients to obtain new access tokens without re-authenticating. Select Yes if your app needs sessions longer than the access token lifetime or runs background operations. SPAs using authorization code + PKCE typically use refresh tokens.

**Idle session behavior**
> Sliding window resets the inactivity timer on each user action — the session stays alive as long as the user is active. Fixed expiry terminates the session at a hard deadline regardless of activity. NIST 800-63B requires both inactivity timeout and absolute session limit at AAL2+ — they are not alternatives. HIPAA automatic logoff is addressable, not required, and specifies no numeric value.

**Token binding**
> Sender-constrained tokens bind the token cryptographically to the client that requested it, preventing use by another party even if stolen. Unbounded bearer tokens are valid for any presenter.

Per-option descriptions in the tooltip only (not inline):
- None: Standard bearer token. Valid for any presenter. Lifetime recommendations are conservative.
- DPoP: RFC 9449. Token bound to a client-held key pair. Improves security posture — does not justify longer lifetimes unless server-provided nonces are in use.
- mTLS: RFC 8705. Token bound to the client certificate. Strongest binding — standards are silent on lifetime extension for mTLS-bound tokens.

---

## Output

The result card has five sections in this order:

1. **Warnings** — advisory banner above the policy. Styled as muted advisory, not an error state.
2. **Recommended policy** — the dominant block. Primary output.
3. **Re-auth triggers** — implementation guidance that follows from the policy.
4. **Citations** — collapsed by default, expandable. One citation block per field.
5. **Disclaimer** — at the bottom of the card.

Export actions (Copy policy statement, Export JSON) are anchored to the top right of the result card. Always visible, not buried below the output.

### Two-tier display pattern

Every numeric field displays in two tiers. This is the core differentiator of the tool and must be visually distinct:

- **Recommended value** — displayed prominently as the primary value
- **Standards floor** — secondary annotation directly beneath the recommended value, in a smaller weight. Cites the exact clause. If no standard mandates a specific value, states: "No specific value mandated — recommendation reflects community practice."

Example for access token lifetime:

```
Access token lifetime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recommended      15 minutes
                 Community practice — SPA public client,
                 high sensitivity, HIPAA context.
                 Consistent with RFC 9700 §2.2.1.

Standards floor  No specific value mandated by RFC 6749
                 or RFC 9068. RFC 9700 §2.2.1 requires
                 access tokens be short-lived.
```

### Recommended policy fields

| Field | Description | M2M |
|---|---|---|
| Access token lifetime | Duration before the access token expires | Included |
| Refresh token lifetime | Duration before the refresh token expires | SHOULD NOT be issued per RFC 6749 §4.4.3. If shown, note that authorization servers may issue with documented justification. |
| Refresh token rotation | Required for public clients per RFC 9700 §2.2.2. Recommended but not required for confidential clients. | Not applicable |
| Absolute session limit | Hard cap on total session length regardless of activity. Required at AAL2+ per NIST 800-63B Rev 4. | Not applicable — no user session |
| Idle timeout — IdP layer | Inactivity limit configured in the IdP session policy. Must match app-layer value. | Not applicable |
| Idle timeout — App layer | Inactivity detection and session termination enforced in application code. | Not applicable |
| Token storage | Where tokens should be stored, with one sentence of reasoning. For SPAs: BFF pattern recommended — tokens never reach the browser. | Server-side secret store — never in code or client |

**On idle timeouts:** NIST 800-63B defines inactivity timeout (resets with activity) and overall timeout (fixed from last authentication). Both are required at AAL2 and AAL3 — they are not alternatives. Both values output separately. Both must match between IdP and app layers.

**On token binding and lifetime:** Token binding improves security posture but does not justify longer access token lifetimes. RFC 9449 §11.2 states deployments without server-provided nonces SHOULD NOT issue long-lived DPoP-bound access tokens. RFC 8705 is silent on lifetime. Token binding and short lifetimes are independent, complementary controls.

### Re-auth triggers

Two sub-sections, visually separated — not a flat list with prefixes.

**IdP session policy** — configure in the IdP:
- Absolute session limit (max age) — hard cap on total session length
- Inactivity timeout — must mirror the app-layer idle timeout. Without this, a valid refresh token can outlive an app-layer logout.

**Application layer** — implement in application code:
- Idle detection and session termination — redirect to login after N minutes of inactivity
- Step-up re-auth before sensitive actions — accessing PHI, changing credentials, payment transactions
- Re-auth on privilege escalation

**M2M:** Not applicable. Client authenticates automatically on token expiry using client credentials.

### M2M output

The following fields are not shown for M2M:
- Refresh token lifetime
- Refresh token rotation
- Absolute session limit
- Idle timeout (both layers)
- Re-auth triggers

M2M output shows:
- Access token lifetime
- Token storage
- Token binding recommendation
- Applicable warnings
- Citations

### Warnings

Rendered above the recommended policy. Advisory styling — not an error state. All warnings name the specific risk and a concrete mitigation, not generic advice.

| Combination | Warning |
|---|---|
| SPA + FedRAMP High | FedRAMP High controls SC-10, SC-23, and AC-12 require server-enforced session management, server-side session identifier generation, and demonstrable session termination. Client-side token deletion is insufficient — the token remains valid server-side. Adopt a Backend for Frontend (BFF) pattern. FedRAMP-authorized SPA products (Okta, Salesforce) all use server-side session backends. |
| SPA + refresh tokens + no BFF | Refresh tokens in browser-accessible storage are vulnerable to XSS exfiltration. Rotation alone is insufficient — a persistent attacker can steal rotated tokens continuously before the application uses them. Primary mitigation: BFF pattern (tokens never reach the browser). If BFF is not feasible: DPoP sender-constraining plus strict CSP. |
| SPA + High sensitivity + No token binding | No sender-constraining configured. A stolen bearer token is valid for the full access token lifetime with no way to invalidate it mid-flight. Short access token lifetime and refresh token rotation reduce the window — they do not eliminate the risk. BFF pattern recommended as primary mitigation. |
| Mobile + Sliding window | iOS aggressively suspends background processes, which can interrupt token refresh and cause unexpected session termination. Validate token refresh behavior against OWASP MASTG and platform-specific guidance before relying on sliding window behavior. |
| M2M + HIPAA | HIPAA §164.312(a)(1) covers software programs granted access rights to ePHI — including M2M. BAA requirements under 45 CFR §§164.502(e) and 164.504(e) apply regardless of whether access is human or automated. This tool covers technical token controls only. |
| High sensitivity + Sliding window only, no absolute timeout | Idle timeout alone is insufficient at high sensitivity. An attacker with a hijacked session can generate periodic activity to prevent the idle timeout from firing indefinitely. NIST 800-63B requires both timeout types at AAL2+. Add an absolute session limit. |
| Consumer + Refresh token lifetime > 30 days | Consumer devices are more likely to be shared, lost, or compromised. Refresh tokens valid longer than 30 days create persistent account takeover risk on devices the user no longer controls. Reduce refresh token lifetime or require periodic full re-authentication. |
| Any app + No token revocation capability | Without RFC 7009 token revocation support, a compromised token remains valid until expiry. NIST 800-63B §7.1 requires session secrets be invalidated on logout — not achievable without revocation. Verify your authorization server supports and enforces token revocation. |
| Idle timeout > Absolute session limit | Idle timeout exceeds the absolute session limit. The absolute limit will always fire first — the idle timeout is unreachable and provides no protection. Reduce idle timeout below the absolute session limit. |

### Citations

Collapsed by default. Expandable per field. Format: standard reference + clause + one sentence explaining the direct connection to the recommendation.

Primary standards:
- **NIST SP 800-63B Rev 4** (August 2025) — session and authentication assurance requirements
- **RFC 9700** — OAuth 2.0 Security BCP (January 2025)
- **RFC 6749** — OAuth 2.0 core
- **RFC 9068** — JWT profile for access tokens
- **RFC 9449** — DPoP
- **RFC 8705** — mTLS token binding
- **draft-ietf-oauth-browser-based-apps-26** (December 2025) — SPA token storage and BFF pattern

Cite conservatively. If a rule cannot be grounded in one of the above, flag it rather than including it.

Where a stronger control was not selected, surface a single upgrade note inline beneath the relevant field's standards floor annotation. Styled as a distinct callout — coral-light background, smaller text. One upgrade note per field maximum. Not in the citations block.

Example: beneath the Token storage field's standards floor annotation —
> "Token binding not configured. DPoP (RFC 9449) would reduce bearer token risk at this sensitivity level."

**FedRAMP-conditional note** — shown only when compliance = FedRAMP Moderate or FedRAMP High:
> "Recommendations cite NIST SP 800-63B Rev 4 (August 2025). If your ATO references Rev 3, verify — AAL2 idle timeout was 30 minutes (SHALL) under Rev 3, relaxed to 1 hour (SHOULD) in Rev 4."

### Disclaimer

Dedicated section at the bottom of every result card.

> Recommendations are grounded in NIST SP 800-63B Rev 4, RFC 9700, RFC 6749, RFC 9068, and draft-ietf-oauth-browser-based-apps-26 — not a compliance determination or substitute for a security review. Verify against your ATO, organizational requirements, or legal counsel.
>
> Standards basis last verified: [Month Year]

---

## CTAs

| Location | Label | Type |
|---|---|---|
| Each input step | Next → | Primary |
| Each input step | ← Back | Secondary |
| Result card — top right | Copy policy statement | Primary |
| Result card — top right | Export JSON | Secondary |
| Result card — bottom | Start over | Tertiary |
| Shareable URL | — | Generated automatically on result render |

"Copy policy statement" is the primary action on the result card. It produces the highest-value export for the audience — a plain English paragraph ready to drop into a security doc or architecture decision record.

---

## Rules engine

The recommendation is produced by a rules engine, not a lookup table. Each input value contributes independently to the output. The output is assembled from those contributions.

### Contribution model

For each input value, define its contribution to each output field:

| Output field | Contribution type |
|---|---|
| Access token lifetime | Modifier — shorten or lengthen base value |
| Refresh token lifetime | Modifier — shorten or lengthen base value |
| Refresh token rotation | Set yes / no / not applicable. Scope to client type. |
| Absolute session limit | Set value |
| Idle timeout — IdP layer | Set value |
| Idle timeout — App layer | Set value |
| Re-auth triggers — IdP layer | Append to list |
| Re-auth triggers — App layer | Append to list |
| Token storage | Set or constrain |
| Warnings | Append if combination matches a warning condition |
| Citations | Append applicable standard reference |

### Grounding requirement

Every numeric recommendation must trace to either a specific standards clause or an explicit statement that it represents community practice. If a rule cannot be grounded, flag it for SME review rather than including it silently.

### Conflict detection

Where two rules produce contradictory output for the same field, surface a warning and apply the stricter value. Do not resolve conflicts silently.

---

## Export formats

**Copy as policy statement** — plain English paragraph suitable for a security policy doc, architecture decision record, or change request. Includes all output fields and key citations in prose form.

Example output for: SPA · Consumers · High sensitivity · HIPAA · Refresh tokens: Yes · Fixed expiry · No token binding

> This application uses short-lived access tokens (15 minutes) with rotating refresh tokens valid for up to 8 hours. Token rotation is required on every use per RFC 9700 §2.2.2, which mandates rotation for public clients. Sessions terminate after 15 minutes of inactivity and are hard-capped at 8 hours absolute. Both limits must be enforced at the IdP session policy layer and mirrored in application code — the IdP inactivity timeout must match the app-layer value to prevent refresh tokens outliving an app-layer logout. Re-authentication is required at the IdP after 8 hours and in application code before accessing PHI, changing credentials, or performing payment transactions. The recommended token storage approach is a Backend for Frontend (BFF) pattern — tokens are held server-side and never reach the browser. Where a BFF is not feasible, httpOnly cookies are the minimum acceptable alternative; localStorage and sessionStorage are not acceptable for PHI access. These controls reflect community practice for public clients handling PHI, consistent with RFC 9700 §2.2.1 (short-lived access tokens), RFC 6749 §10.4 (refresh token rotation), NIST SP 800-63B Rev 4 §7.2 (session timeout requirements at AAL2), and draft-ietf-oauth-browser-based-apps-26 (BFF as primary storage pattern for SPAs).

The rules engine must be able to produce a coherent paragraph in this format for any valid input combination. The example above is the template — input-specific values are substituted by the rules engine at render time.

**Export JSON** — structured output of all fields.

---

## States

| State | Description |
|---|---|
| Step N | First input renders on load. One input visible at a time. Stepper shows all steps. |
| Result | Warnings (if any) · Recommended policy · Re-auth triggers · Citations (collapsed) · Disclaimer · Export actions anchored top right |

---

## Shareable URL

Result state is fully reconstructable from query params. No backend required.

Example: `token-policy.nalegave.com?app=spa&users=consumers&sensitivity=high&compliance=hipaa&refresh=yes&idle=fixed&binding=none`

On load with valid params, render the result directly without stepping through inputs.

**Error handling for invalid or incomplete params:**

- If all params are valid and complete → render result directly
- If some params are valid, some invalid or missing → pre-fill the valid params, drop to the first unanswered step, show a single inline notice above the stepper: *"Some inputs couldn't be parsed from the URL. Continue from where we left off."* No modal, no error page.
- If no params are valid or URL is malformed → drop to step 1 with no pre-fill, no notice
- Invalid param values (e.g. `app=unknown`) are treated as missing — that step is unanswered

---

## What it is not

- Not a certification or compliance attestation
- Not a substitute for a security review
- Not connected to any IdP or platform — all inputs and outputs are generic

---

## Out of scope for v1

- Platform-specific config snippets (Okta, Auth0, Azure AD, Cognito)
- Device flow / IoT token types
- Step-up auth token lifetime as a separate output field
- Saving or comparing multiple assessments
- "Show all inputs" mode for repeat users