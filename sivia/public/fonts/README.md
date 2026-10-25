# Polices embarquées pour l'export PDF (chantier 6)

`services/recipePdf.ts` embarque ces fichiers TTF dans le VFS de jsPDF
(`addFileToVFS`) au premier export, pour un rendu fidèle de la fiche imprimée.

À déposer ici :

- `Fraunces-Regular.ttf` — titres (fallback : Helvetica-Bold)
- `Caveat-Regular.ttf` — anecdotes manuscrites (fallback : Times-Italic)

Sources (Google Fonts, licences OFL) :

- https://fonts.google.com/specimen/Fraunces
- https://fonts.google.com/specimen/Caveat

Sans ces fichiers, l'export PDF fonctionne avec les polices de repli.
