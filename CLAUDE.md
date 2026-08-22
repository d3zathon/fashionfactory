# Fashion Factory Nepal

## Repository
- GitHub: https://github.com/d3zathon/fashionfactory
- Main working branch: feat/fashion-factory-foundation

## Rules
- Preserve the existing architecture: UI → hooks → services → providers.
- Do not rewrite architecture unless explicitly requested.
- Run `npm run build` after meaningful changes.
- Run `npx tsc --noEmit` when TypeScript changes are made.
- Never commit `.next/` or `node_modules/`.
- Keep `package-lock.json` committed.
- Verify phone, WhatsApp, Instagram, and Maps links before considering contact-related work complete.
- Test mobile layouts at 320px, 375px, 414px, and desktop widths when UI changes are made.
- Before pushing, inspect `git diff`, run tests/build, commit only intended files, and verify the remote branch after pushing.

## Git workflow
1. Inspect first.
2. Make the smallest correct change.
3. Test.
4. Review the diff.
5. Commit with a descriptive message.
6. Push to the current feature branch.
7. Verify the remote commit.
