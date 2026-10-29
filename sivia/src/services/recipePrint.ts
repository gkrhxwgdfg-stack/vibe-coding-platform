import { categoryMeta } from '@/lib/constants'
import { formatDate, formatDuration } from '@/lib/format'
import { photoPublicUrl } from '@/services/recipes'
import type { RecipeWithMeta } from '@/lib/types'

/**
 * Export « carnet familial » d'une recette.
 *
 * Pas de dépendance lourde : on génère un document HTML autonome, mis en
 * forme dans l'esprit de l'application (Fraunces, polaroïd, tampon,
 * anecdote manuscrite), ouvert dans une fenêtre d'impression. Le navigateur
 * propose alors « Enregistrer en PDF » — sur mobile comme sur ordinateur.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Construit le document HTML imprimable d'une recette */
export function buildRecipePrintHtml(recipe: RecipeWithMeta, familyName: string): string {
  const meta = categoryMeta(recipe.category)
  const photo = photoPublicUrl(recipe.photo_url)
  const author = recipe.author?.display_name ?? '…'
  const authorRole = recipe.author?.family_role ? ` · ${recipe.author.family_role}` : ''
  const prep = formatDuration(recipe.prep_time)
  const cook = formatDuration(recipe.cook_time)

  const ingredients = recipe.ingredients
    .map((line) => `      <li>${escapeHtml(line)}</li>`)
    .join('\n')
  const steps = recipe.steps
    .map((step, i) => `      <li><span class="num">${i + 1}</span> ${escapeHtml(step)}</li>`)
    .join('\n')

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(recipe.title)} — Savia</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Nunito+Sans:wght@400;600;700;800&family=Fraunces:wght@500;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px; color: #2a211b;
    font-family: "Nunito", system-ui, sans-serif; font-size: 16px; line-height: 1.6;
    background: #fdfbf7;
  }
  .page { max-width: 720px; margin: 0 auto; background: #ffffff; padding: 40px;
          border-radius: 16px; box-shadow: 0 6px 18px -10px rgba(74,55,40,.28); }
  h1 { font-family: "Fraunces", Georgia, serif; font-size: 34px; margin: 0 0 4px; line-height: 1.2; }
  h2 { font-family: "Fraunces", Georgia, serif; font-size: 22px; margin: 32px 0 12px;
       border-bottom: 2px dashed #e4a93c; padding-bottom: 6px; }
  .kicker { font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
            color: #2e5939; font-weight: 800; margin: 0 0 6px; }
  .byline { font-family: "Fraunces", cursive; font-size: 24px; color: #2a211b; margin: 4px 0 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 16px 0 0; color: #6b5d4f; font-weight: 700; }
  .badge { display: inline-block; background: #fdfbf7; border: 2px solid #2e5939; color: #2e5939;
           border-radius: 999px; padding: 4px 14px; font-weight: 800; font-size: 14px; }
  .polaroid { background: #fff; padding: 12px 12px 14px; border-radius: 4px; width: 280px;
              margin: 24px auto; transform: rotate(-2deg);
              box-shadow: 0 10px 24px -14px rgba(74,55,40,.35); }
  .polaroid img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 2px; display: block; }
  .polaroid figcaption { font-family: "Fraunces", cursive; font-size: 20px; color: #6b5d4f;
                          text-align: center; padding-top: 10px; }
  ul.ingredients { list-style: none; padding: 0; margin: 0; }
  ul.ingredients li { padding: 6px 0 6px 24px; position: relative; }
  ul.ingredients li::before { content: ""; position: absolute; left: 4px; top: 14px;
                               width: 8px; height: 8px; border-radius: 50%; background: #2e5939; }
  ol.steps { margin: 0; padding: 0; list-style: none; counter-reset: step; }
  ol.steps li { display: flex; gap: 12px; padding: 10px 0; align-items: flex-start; }
  ol.steps li .num { flex: none; width: 34px; height: 34px; border-radius: 50%; background: #2e5939;
                     color: #fdfbf7; font-family: "Fraunces", Georgia, serif; font-weight: 700;
                     display: inline-flex; align-items: center; justify-content: center; }
  .anecdote { background: #ffffff; border: 2px dashed rgba(138,90,43,.55); border-radius: 16px; padding: 20px 24px; }
  .anecdote blockquote { font-family: "Fraunces", cursive; font-size: 28px; color: #2a211b;
                          margin: 0; line-height: 1.4; }
  .origin { background: #f9efdb; border: 2px dashed rgba(138,90,43,.55); border-radius: 16px; padding: 16px 20px; }
  .origin p { font-family: "Fraunces", cursive; font-size: 24px; color: #2a211b; margin: 4px 0 0; }
  .footer { display: flex; align-items: center; justify-content: space-between; gap: 16px;
             margin-top: 36px; padding-top: 20px; border-top: 1.5px solid rgba(74,55,40,.15);
             color: #6b5d4f; font-size: 14px; flex-wrap: wrap; }
  .stamp { flex: none; width: 110px; height: 110px; border-radius: 50%; border: 3px dashed #c93a2b;
           color: #c93a2b; display: inline-flex; flex-direction: column; align-items: center;
           justify-content: center; text-align: center; transform: rotate(-8deg);
           font-family: "Fraunces", Georgia, serif; font-weight: 700; text-transform: uppercase; }
  .stamp small { font-family: "Nunito", sans-serif; font-size: 9px; letter-spacing: .12em; }
  .stamp span { font-size: 17px; text-transform: none; padding: 0 8px; line-height: 1.15; }
  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; max-width: none; }
  }
</style>
</head>
<body>
  <main class="page">
    <p class="kicker">Savia · ${escapeHtml(meta.label)}</p>
    <h1>${escapeHtml(recipe.title)}</h1>
    <p class="byline">créée par ${escapeHtml(author)}${escapeHtml(authorRole)}</p>
    <div class="meta">
      <span class="badge">${escapeHtml(meta.label)}</span>
      <span>${recipe.servings} part${recipe.servings > 1 ? 's' : ''}</span>
      ${prep ? `<span>Prépa ${escapeHtml(prep)}</span>` : ''}
      ${cook ? `<span>Cuisson ${escapeHtml(cook)}</span>` : ''}
    </div>

    ${
      photo
        ? `<figure class="polaroid">
      <img src="${escapeHtml(photo)}" alt="${escapeHtml(recipe.title)}" />
      <figcaption>${escapeHtml(recipe.title)}</figcaption>
    </figure>`
        : ''
    }

    <h2>Ce qu'il faut</h2>
    <ul class="ingredients">
${ingredients}
    </ul>

    <h2>La recette, étape par étape</h2>
    <ol class="steps">
${steps}
    </ol>

    ${
      recipe.anecdote
        ? `<h2>Le secret — celui qu'on ne dit qu'à la famille</h2>
    <div class="anecdote">
      <blockquote>« ${escapeHtml(recipe.anecdote)} »</blockquote>
      <p style="margin:10px 0 0;color:#6b5d4f;font-weight:700">— ${escapeHtml(author)}</p>
    </div>`
        : ''
    }

    ${
      recipe.origin_story
        ? `<h2>L'origine du plat</h2>
    <div class="origin">
      <p>« ${escapeHtml(recipe.origin_story)} »</p>
    </div>`
        : ''
    }

    <div class="footer">
      <div>
        <p style="margin:0;font-weight:800">Transmise par ${escapeHtml(author)}${escapeHtml(authorRole)}</p>
        <p style="margin:2px 0 0">Dans le carnet depuis le ${escapeHtml(formatDate(recipe.created_at))}</p>
        <p style="margin:8px 0 0;font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:17px;color:#6b5d4f">
          Savia — le carnet de la famille ${escapeHtml(familyName)}
        </p>
      </div>
      <div class="stamp" role="img" aria-label="Tampon : recette de la part de ${escapeHtml(author)}">
        <small>De la part de</small>
        <span>${escapeHtml(author)}</span>
      </div>
    </div>
  </main>
</body>
</html>`
}

/**
 * Ouvre la fenêtre d'impression « carnet familial » de la recette.
 * L'utilisateur choisit « Enregistrer en PDF » dans la boîte de dialogue
 * du navigateur (aucun téléchargement forcé, compatible mobile).
 */
export function printRecipe(recipe: RecipeWithMeta, familyName: string): boolean {
  const html = buildRecipePrintHtml(recipe, familyName)
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  // Laisse le temps au document (et aux polices) de se charger avant d'imprimer
  const trigger = () => {
    win.focus()
    win.print()
  }
  if (win.document.readyState === 'complete') {
    setTimeout(trigger, 600)
  } else {
    win.addEventListener('load', () => setTimeout(trigger, 600))
  }
  return true
}
