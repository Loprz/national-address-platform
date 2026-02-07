# Audit a Component for French Content

Search the specified component directory for all French-language content that needs translation or replacement.

## Steps

1. Search for hardcoded French strings in `.tsx`, `.ts`, `.js` files
2. Search for French terms: commune, adresse, voie, numéro, département, région, cadastre, parcelle
3. Search for French UI patterns: button labels, form labels, error messages, tooltips, placeholders
4. Search for French API/config references: `gouv.fr`, `insee`, `fantoir`, `etalab`
5. Search for French map references: Lambert-93, IGN tiles, French bounding boxes
6. Produce a categorized report:
   - **UI Strings**: Files with hardcoded French text (count per file)
   - **Data Model**: Files referencing French data concepts (commune, INSEE, etc.)
   - **External Services**: Files calling French government APIs
   - **Map/Geo**: Files with French geographic config
   - **Branding**: Files with French government branding
7. Save the report to `.cursor/plans/audit-{component}.md`
