# Voice & Tone

All UI copy, labels, descriptions, tooltips, errors, and documentation must follow these rules. This applies to placeholder text and default copy as well.

If a sentence can be shorter without losing meaning, shorten it.

## Core Rules

- Write like a practitioner speaking to another practitioner.
- Use plain, exact language.
- Prefer statements over setup.
- Prefer specificity over polish.
- Cut filler before adding explanation.
- Make claims the product or documentation can support.

## Word List

### Never Use

- seamlessly, effortlessly, robust, powerful, leverage, empower
- streamline, optimize, utilize, comprehensive, cutting-edge, innovative
- "In today's [adjective] landscape..."
- "Whether you're a [persona] or a [other persona]..."
- "It's worth noting that..."
- "Simply [do the thing]"
- "Feel free to..."
- "I've created...", "I've added...", "Here's your..."
- "Great!", "Certainly!", "Absolutely!"

### Prefer

- Direct verbs over noun phrases: "configure" not "perform configuration of"
- Active voice: "Okta issues the token" not "the token is issued by Okta"
- Concrete over abstract: "15 minutes" not "a short window"
- Exact technical terms: "refresh token rotation" not "enhanced security for long-lived sessions"

## Compression by Element

| Element | Rule | Example |
|---|---|---|
| Titles, headings | Maximum compression. Statement, not question. | "Token lifetime and session policy for your stack" |
| Labels | Noun or short noun phrase. No verbs. No punctuation. | "Access token lifetime" |
| Buttons, pills, tags | Verb + noun. Name the action. | "Export policy" |
| Subtitles, descriptions | Complete thought. Explain what it does or what happens next. | "Answer 5 questions. Get a policy recommendation with NIST citations." |
| Citations, footnotes | Full explanation. Trust matters more than brevity. | "Short-lived access tokens limit exposure on theft. Rotation prevents replay." |
| Errors | What happened. Then what to do. | "Token expired. Re-authenticate to continue." |
| Empty states | State what is missing. Do not narrate emotion. | "No assessments yet." |
| Tooltips | Complete sentence. Do not start with "This is". | "Stable identifier for this user. Does not change on email update." |

## UI Copy Patterns

### Labels

```text
OK: Access token lifetime
NO: Set your access token lifetime
```

### Descriptions

```text
OK: Controls how long an access token remains valid before the client must refresh.
NO: Access token lifetime is an important security setting that determines the duration...
```

### Empty States

```text
OK: No assessments yet.
NO: It looks like you haven't started an assessment yet. Get started below!
```

### Errors

```text
OK: Token expired. Re-authenticate to continue.
NO: Oops! Something went wrong with your session. Please try again.
```

### Buttons

```text
OK: Export policy
OK: Start assessment
NO: Get started
NO: Let's go
```

### Tooltips

```text
OK: The unique Okta identifier for this user. Stable across email changes.
NO: This is the unique Okta GUID that identifies the user and remains stable...
```

## Documentation

- Headings are statements or imperatives, not gerunds or questions.
- No marketing copy in READMEs or docs.
- Code examples over prose where possible.
- State the caveat before the recommendation, not after.

```text
OK: Configure your redirect URI
NO: Configuring Your Redirect URI

OK: This only applies to SPAs. For server-side apps, use httpOnly cookies.
NO: Use in-memory storage for tokens, though note this only applies to SPAs.
```

## Agent Behavior

- Do not narrate your own actions in product copy.
- Do not add enthusiasm or reassurance unless the interface explicitly needs it.
- Do not invent benefit language to make copy sound more polished.
- When in doubt, remove adjectives first.
