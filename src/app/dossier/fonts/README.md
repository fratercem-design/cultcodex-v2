# Dossier fonts

Self-hosted for `src/app/dossier/page.tsx` via `next/font/local`, so the build
never fetches from Google Fonts.

Each file is the latin-subset variable woff2 that Google Fonts serves (the same
bytes `next/font/google` downloaded before). Only the styles the page renders
are kept.

| File | Family | Style | Source |
| --- | --- | --- | --- |
| `BodoniModa-Italic-latin.woff2` | Bodoni Moda | italic | https://fonts.gstatic.com/s/bodonimoda/v28/aFTB7PxzY382XsXX63LUYJSPUqb0pL6OQqxrZLnVbtxSXgOXEFZ8.woff2 |
| `Cinzel-latin.woff2` | Cinzel | normal | https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2 |
| `CormorantGaramond-Italic-latin.woff2` | Cormorant Garamond | italic | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2 |
| `CormorantGaramond-latin.woff2` | Cormorant Garamond | normal | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2 |

## License

All three families are licensed under the SIL Open Font License 1.1, which
permits bundling and redistributing them with software as long as the copyright
notice and license travel with them and the fonts are not sold on their own.
None of the three declares a Reserved Font Name. The license texts are copied
verbatim from https://github.com/google/fonts/tree/main/ofl:

- `OFL-BodoniModa.txt`
- `OFL-Cinzel.txt`
- `OFL-CormorantGaramond.txt`
