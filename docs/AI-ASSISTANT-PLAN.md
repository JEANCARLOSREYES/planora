# Planora AI assistant proposal

Status: excluded from the free launch at the owner's request. No AI calls,
credentials, or billing are activated. The ideas below are reference notes only,
not work approved for this release.

Finish and verify registration, login, account isolation, recovery, and privacy
before enabling AI features on a public deployment.

## First release

- Summarize a page the signed-in user explicitly selects.
- Suggest tasks from those notes, with a preview before anything is saved.
- Suggest a weekly plan from tasks the user explicitly chooses to share.

Use the OpenAI API from Planora's server. Never expose the API key in browser
code, client-visible environment variables, exports, or the GitHub repository.
Activation requires a separately configured API project, billing approval, and
an agreed usage budget. Do not ask the user to paste a key into this chat.

## Privacy and safety requirements

- AI stays optional and off until the user chooses an AI action.
- Resolve ownership on the server before reading any selected records.
- Show which content will leave Planora and explain the provider's retention.
- Never send passwords, session tokens, or unrelated users' records.
- Treat page contents and model output as untrusted data, not permissions.
- Require confirmation before applying suggested edits or creating tasks.
- Enforce server-side per-account quotas, request-size limits, concurrency limits,
  timeouts, and a global application spending cutoff.
- Do not log private prompts or responses by default.
- Test unauthorized access, cross-account references, prompt injection, quota
  exhaustion, provider failure, and duplicate task submissions.

OpenAI API data is not used for training by default, but this does not mean no
retention. Provider abuse monitoring and endpoint-specific storage policies must
be disclosed accurately before activation.

## Official references

- https://developers.openai.com/api/docs/quickstart
- https://developers.openai.com/api/docs/guides/your-data
