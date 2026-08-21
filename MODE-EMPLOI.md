# Mode d'emploi — le freebie facechart

Ce document s'adresse à toi, Lauryne. Il n'y a pas besoin de savoir coder pour
faire vivre l'application : tout ce qui change souvent est rassemblé dans un
seul fichier, `app/donnees.js`, écrit pour être lisible.

---

## 1. Voir l'application sur ton ordinateur

Double-clique sur **`Voir mon appli.bat`**.

Une fenêtre noire s'ouvre : c'est un petit serveur, **laisse-la ouverte** tant
que tu utilises l'application. Ton navigateur s'ouvre tout seul sur
`http://localhost:8080`.

Pour tout arrêter, ferme la fenêtre noire.

> Pourquoi pas un simple double-clic sur `index.html` ? Parce que les
> navigateurs interdisent à une page ouverte depuis un dossier de charger ses
> propres fichiers. Le petit serveur contourne cette limite, comme le fera
> l'hébergeur une fois en ligne.

Après avoir modifié un fichier, il suffit de **recharger la page** (F5).

---

## 2. Modifier les couleurs

Ouvre `app/donnees.js` avec le Bloc-notes. Cherche la partie `COULEURS`.

```js
{ id: 'violet', nom: 'Violet lavande', hex: '#8B5FC0', ref: '27', kits: ['A'] },
```

| Champ  | À quoi ça sert |
|--------|----------------|
| `id`   | nom technique, ne le change pas une fois l'application en ligne |
| `nom`  | ce que voient les gens, dans l'appli et sur la fiche |
| `hex`  | la teinte à l'écran, **telle qu'elle rend sur la peau** |
| `ref`  | ta référence interne, jamais affichée |
| `kits` | les kits qui contiennent cette couleur, ex. `['A', 'C']` |

Pour ajuster une teinte, change seulement le `hex`. Le format est un `#` suivi
de six caractères. Un site comme un nuancier en ligne te donnera le code d'une
couleur que tu vises.

**Ajouter une couleur** : recopie une ligne existante, change tout, et n'oublie
pas la virgule à la fin (sauf sur la toute dernière ligne de la liste).

---

## 3. Modifier les kits

Toujours dans `app/donnees.js`, la partie `KITS` :

```js
{ id: 'A', nom: 'Kit A', lien: 'https://www.labaguettemaquille.fr' },
```

Change `nom` pour le vrai nom commercial (« Kit Sorcière »), et `lien` pour
l'adresse exacte de la fiche produit. Une couleur peut appartenir à plusieurs
kits : mets-les tous dans son champ `kits`.

---

## 4. Ajouter un visage

1. Dépose l'image dans `images/visages/`.
2. Dans `app/donnees.js`, partie `VISAGES`, recopie un bloc existant :

```js
{
  id: 'lou',
  nom: 'Lou',
  image: 'images/visages/visage1.jpg',
  taille: { w: 1080, h: 1440 },
  cadre:  { x: 110, y: 210, w: 880, h: 1080 },
  visage: { gauche: 120, droite: 745, ligneYeux: 590 }
}
```

- `taille` : les dimensions du fichier (clic droit sur l'image → Propriétés).
- `cadre` : la zone de l'image à montrer. Ça recadre à l'écran **sans jamais
  modifier ton fichier**. `x` et `y` = le coin haut gauche, `w` et `h` = la
  largeur et la hauteur.
- `visage` : les repères qui donnent l'échelle. `gauche` et `droite` sont les
  tempes, `ligneYeux` la hauteur des yeux — **comptés depuis le coin du cadre**,
  pas depuis le coin de l'image.

### Régler la taille des pochoirs

Si les motifs te paraissent tous trop gros ou trop petits, ouvre
**`outils/echelle.html`** (avec le serveur lancé, à l'adresse
`http://localhost:8080/outils/echelle.html`).

Tu y vois le visage sous un quadrillage d'un centimètre, quelques pochoirs
posés dessus, et un curseur. Fais-le glisser jusqu'à ce que la tête te paraisse
juste, puis reporte le nombre obtenu dans `LARGEUR_VISAGE_MM`, dans
`app/donnees.js`.

Ce réglage unique commande la taille de **tous** les pochoirs à la fois : la
taille propre de chaque motif, elle, est mesurée sur ton fichier SVG et ne
bouge jamais.

---

## 5. Ajouter une planche de pochoirs

Il te faudra mon aide pour la première étape, mais voici le principe.

1. Le fichier SVG de la planche est découpé en morceaux numérotés. Ouvre
   `outils/diag2.html` (avec le serveur lancé) : chaque morceau y est affiché
   en gros plan avec son numéro et sa taille réelle.
2. Le tracé de la planche est recopié dans `app/planches.js`.
3. Dans `app/donnees.js`, partie `POCHOIRS`, on décrit les formes :

```js
{ id: 'araignee', nom: 'Araignée', traces: [8] }
```

- `traces` : les numéros des morceaux qui composent la forme. Plusieurs numéros
  = un seul tampon (les bulles du chaudron sont sept morceaux).
- `colleA` : le motif se pose automatiquement sur un autre (le visage du crâne
  se cale sur le crâne).
- `bande` : pour un bord de planche (les coulures, les fanions), où la peinture
  passe **autour** du plastique.

---

## 6. Modifier les textes

Tout en bas de `app/donnees.js`, la partie `TEXTES` : le titre de la page
d'accueil, la phrase d'explication, le bouton, l'adresse du site.

---

## 7. Mettre en ligne

L'application est un simple dossier de fichiers, sans étape de compilation.
Pour publier une mise à jour, on renvoie le dossier sur l'hébergement (GitHub
Pages), et la page systeme.io se met à jour toute seule puisqu'elle ne fait que
l'afficher dans un cadre.

Les dossiers `outils/` et le fichier `Voir mon appli.bat` ne servent qu'à toi ;
ils peuvent rester, ils ne gênent pas.

---

## 8. En cas de page blanche

Tu as sans doute oublié une virgule ou un guillemet dans `app/donnees.js`.
Dans le navigateur, appuie sur **F12**, onglet **Console** : le message rouge
indique la ligne fautive. Sinon, annule ta modification et redemande-moi.
