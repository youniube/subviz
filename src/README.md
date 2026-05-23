# Source layout

`subviz.js` is still the deployable Surge single-file script. The maintainable source now lives under `src/` and is bundled by `tools/build-subviz.js`.

## Files

- `server/00-bootstrap.js`: version, HTTP response helpers, base64 helpers.
- `server/10-country.js`: country/flag/CDN detection rules.
- `server/20-parser.js`: Clash, URI and Surge proxy parsers plus subscription analysis.
- `server/30-fetch-geo.js`: remote subscription fetch, sample data and GeoIP fallback.
- `server/40-surge-policy.js`: Surge `policy-descriptor` builder for landing/availability checks.
- `server/50-landing-availability.js`: landing detection and availability check APIs.
- `server/90-html-router.js`: HTML shell and request router.
- `client/app.js`: browser-side UI logic served as `/app.js`.

## Commands

```bash
npm run build   # regenerate subviz.js
npm run check   # rebuild and run syntax checks
npm test        # rebuild and run smoke tests
```

After editing any source file, run `npm run build` and commit both the source change and the regenerated `subviz.js`.
