<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Monthly AI analysis uses an internal same-origin streaming server route and server-only OpenAI Responses helpers; keep keys and prompts out of browser bundles.
- Send only monthly aggregates to AI, excluding customer names and expense descriptions; retain existing browser-local bookkeeping without silently migrating it.
- Persist AI provider access denials in a service-only Cloud table; clear the state only after access is restored and an owner explicitly resumes usage.
