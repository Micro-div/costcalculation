# AGENTS.md

Working rules for AI agents in this repository:

1. **One task at a time.** Never fix unrelated things "while you're there"; list them in your final message instead.
2. **Search before editing.** Before editing, search the code and report the exact files and line numbers involved.
3. **Smallest change.** Make the smallest change that fully solves the problem. Don't add libraries unless the task says so.
4. **Verify after every task.** Run: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm test` (once tests exist). Fix errors you caused.
5. **Commit clearly.** Use the form `type(scope): what and why` (e.g. `fix(location): match whole words only`). No "update ui" style messages. One commit per task.
6. **Finish with a summary.** Report: files changed, what changed in one line each, test results, and anything you noticed but did not touch.
