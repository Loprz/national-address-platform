# Port a BAN Component to US

Port the specified component from French (BAN) to US (NAP) standards.

## Steps

1. Read the porting checklist at `.cursor/rules/porting-checklist.md`
2. Read the coding conventions at `.cursor/rules/coding-conventions.md`
3. Audit the component for French-language strings using grep for common French words: `de`, `la`, `le`, `les`, `des`, `une`, `votre`, `commune`, `adresse`, `voie`
4. Catalog every file that needs changes
5. Set up `next-intl` if it's a Next.js frontend
6. Extract all French UI strings to `messages/en.json` with English translations
7. Create `messages/es.json` with Spanish translations
8. Replace all data model references per the terminology mapping in coding conventions
9. Update map configuration for US geography
10. Run linter and fix any issues
11. Run build to verify no compilation errors
12. Commit with message: `[port] Translate {component} UI to English, swap data model to US`
