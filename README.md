# Facechart interactif — La Baguette Maquille

Une page web où l'on choisit un visage d'enfant illustré, on y compose un
maquillage avec les pochoirs et les couleurs réellement vendus par
[La Baguette Maquille](https://www.labaguettemaquille.fr), puis on repart avec
une fiche A4 à imprimer listant le matériel utilisé.

**En ligne :** https://laurynebaguet.github.io/freebie-facechart/

## Ce qu'on peut faire

- Poser les motifs d'une planche de pochoirs, puis les déplacer, les faire
  pivoter, les retourner en miroir, les repeindre ou les retirer.
- Dessiner au pinceau et gommer, avec une taille réglable.
- Annuler et rétablir chaque geste.
- Changer de visage sans perdre son maquillage, pour comparer un même look.
- Télécharger une fiche A4 avec le dessin en grand et la liste du matériel.

Le travail est sauvegardé en continu dans le navigateur : aucun compte, aucun
serveur, aucune donnée collectée.

## Un choix technique : pas d'étape de build

L'application est faite de fichiers statiques servis tels quels. React est
chargé en UMD, `htm` remplace JSX, et les bibliothèques sont rangées dans
`vendor/` plutôt qu'appelées sur un CDN.

C'est délibéré : la personne qui fait vivre ce projet n'est pas développeuse.
Elle doit pouvoir modifier une couleur, ajouter un visage et republier sans
installer ni maintenir d'outillage. Il n'y a donc ni Node, ni npm, ni
compilation — on édite un fichier, on recharge la page.

## Les pochoirs sont à l'échelle réelle

Les motifs sont découpés dans le SVG de la planche physique, dont le cadre de
dessin est une feuille A4 en millimètres : **une unité vaut un millimètre**.
Les tailles affichées sont donc celles du vrai pochoir, et elles ne sont pas
modifiables — un pochoir a une taille, l'agrandir produirait un maquillage
irréalisable.

Trois natures de motifs coexistent :

- **simple** — un seul découpage ;
- **composé** — plusieurs découpages assemblés dans la position où on les
  emploie, alors que la planche les sépare pour que le plastique tienne ;
- **bande** — un bord de planche, où la peinture passe *autour* du plastique :
  le motif est le négatif du tracé, borné par une fenêtre.

## Organisation

| Chemin | Contenu |
|---|---|
| `index.html`, `styles.css` | La page et son habillage |
| `app/donnees.js` | **Le seul fichier à éditer** : couleurs, kits, visages, pochoirs, textes |
| `app/` | Le reste du code : modèle, rendu, toile, interface, fiche PDF |
| `vendor/` | React, htm, jsPDF |
| `outils/` | Serveur local, réglage de l'échelle, repérage des formes |

## Documents

- [MODE-EMPLOI.md](MODE-EMPLOI.md) — comment faire évoluer l'application sans coder
- [SPEC.md](SPEC.md) — la spécification fonctionnelle
