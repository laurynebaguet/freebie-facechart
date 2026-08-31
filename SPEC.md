# Facechart interactif — La Baguette Maquille

Spécification validée avec Lauryne. Document de référence du projet.

## 1. En deux phrases

Une page web où un parent choisit un visage d'enfant illustré, y compose un
maquillage à l'aide des formes des pochoirs et des couleurs réellement vendues
par La Baguette Maquille, puis télécharge une fiche A4 prête à imprimer
comportant le dessin et la liste du matériel nécessaire.

## 2. Contraintes techniques

| Point | Décision |
|---|---|
| Nature | Frontend seul, SPA, aucun serveur, aucune base de données |
| Framework | React (UMD), sans JSX — syntaxe `htm` |
| Routeur | Aucun |
| Build | **Aucun**. Fichiers statiques servis tels quels |
| Dépendances | Téléchargées dans `vendor/`, pas de CDN à l'exécution |
| Hébergement | **GitHub Pages**, intégré en `<iframe>` dans systeme.io |
| Chemins | Tous relatifs — GitHub Pages sert depuis un sous-dossier |
| Cibles | Ordinateur, tablette, téléphone. Tactile et souris |
| Accès | Libre, aucun formulaire, aucune collecte de données |

## 3. Parcours utilisateur

1. **Accueil** — logo, titre, une phrase d'explication, bouton « C'est parti ».
2. **Choix du visage** — galerie de facecharts. On peut y revenir à tout moment
   sans perdre son travail (voir §6).
3. **Atelier** — le cœur de l'application (§4).
4. **Fin** — récapitulatif à l'écran + téléchargement de la fiche A4 (§5).

## 4. L'atelier

### 4.1 Outils

- **Pochoirs** — les formes sont rangées par set (= une planche physique).
  On choisit une forme, on la pose sur le visage.
- **Pinceau** — trait libre. Choix de la couleur et de la taille.
- **Gomme** — entame le maquillage, taille réglable.
- **Modifier** — pour attraper une forme déjà posée : déplacer, pivoter,
  retourner en miroir, repeindre, supprimer.
- **Tout effacer** — avec confirmation.

La **palette de couleurs est toujours visible**, au-dessus des outils, quel que
soit l'outil actif. Quand une forme est sélectionnée, elle la repeint.

Avant de poser, un **aperçu suit le curseur** : le motif en translucide pour un
pochoir, un cercle à la bonne taille pour le pinceau et la gomme. Le réglage de
taille montre lui aussi le diamètre réel, à l'échelle de l'écran.

### 4.2 Couleurs

Palette = les 9 fards réellement vendus. Aucune couleur libre.

| Nom commercial | Réf. interne |
|---|---|
| Violet lavande | 27 |
| Vert grenouille | 49 |
| Bronze ancien | 8008 |
| Blanc de lune | 21 |
| Noir d'encre | 10 |
| Paille d'or | 09 |
| Bleu océan | 28 |
| Rouge coquelicot | 159 |
| Jaune soleil | 58 |

Chaque couleur appartient à un ou plusieurs **kits** commerciaux (ex. « le
violet se trouve dans le kit Sorcière »). Le récapitulatif final indique, pour
chaque couleur utilisée, le ou les kits où on la trouve. La structure de
données prévoit dès maintenant l'appartenance **multiple**.

Les références internes ne sont **jamais** affichées. Les noms de kits, si.

### 4.3 Comportement des formes de pochoir

- Posées d'un appui sur le visage, dans la couleur active.
- **Taille réelle, ajustable à la marge** : elle correspond à la taille physique
  du pochoir, rapportée à la largeur du visage. On l'ajuste **de 0,7 à 1,5
  fois**, et pas au-delà : entre 3 et 10 ans
  la largeur d'un visage varie d'environ 20 %, mais tripler un pochoir donnerait
  un maquillage intamponnable. La taille réelle en millimètres s'affiche pendant
  qu'on tire — c'est elle qui compte pour maquiller pour de vrai.
  *(Ajouté le 21/08/2026. La première version les figeait complètement.)*
- Restent **manipulables indéfiniment** : déplacement, rotation, miroir,
  changement de couleur, suppression.
- Une seule couleur unie par forme (pas de dégradé en v1).
- **Les commandes dépendent de ce avec quoi on vise**, parce qu'un doigt ne
  vise pas comme une souris :
  - *À la souris*, la forme choisie porte deux poignées : un bouton de rotation
    au-dessus, une pastille d'agrandissement au coin bas droit.
  - *Au doigt*, aucune poignée. **Deux doigts posés sur la forme la font tourner
    et changent sa taille**, comme un autocollant ; deux doigts posés ailleurs
    regardent le visage de plus près, comme avant.
  - Dans les deux cas, **retourner** et **retirer** sont des boutons sous la
    barre d'outils, jamais sur la forme. La touche `Suppr` marche aussi,
    `Échap` désélectionne.

  Les pastilles posées sur la forme faisaient 22 pixels sur un téléphone, et
  l'appui qui les manquait tamponnait un motif de plus.
  *(Revu le 31/08/2026.)*
- Viser le cadre d'une forme sélectionnée — ou sa bordure immédiate — la
  manipule, même si l'outil Pochoirs est actif : on ne pose jamais un motif
  par-dessus par mégarde.

Trois natures de motifs coexistent :

- **simple** — un seul découpage de la planche ;
- **composé** — plusieurs découpages assemblés dans la position où on les
  emploie, alors que la planche les sépare pour que le plastique tienne (les
  bulles du chaudron, le visage du crâne) ;
- **bande** — un bord de planche (coulures, dents de scie). La peinture y passe
  *autour* du plastique : le motif est le négatif du tracé, borné par une
  fenêtre. Une rotation de présentation redresse ces motifs, couchés sur la
  planche.

### 4.4 Corrections

- **Annuler / Rétablir** sur toute action (trait, pose, déplacement, rotation,
  changement de couleur, suppression).
- **Tout effacer** sur le visage courant, avec confirmation.

## 5. Le résultat

**Fiche PDF A4, une page**, générée dans le navigateur :

- un titre au **prénom de l'enfant** — « Le maquillage de Camille » — repris de
  celui qu'on a donné au visage dans la galerie (§3) ;
- le facechart maquillé, en grand ;
- la liste des **couleurs** utilisées : nom commercial, pastille, et le ou les
  kits dans lesquels la trouver ;
- la liste des **pochoirs** utilisés (nom du set + nom de la forme) ;
- chaque entrée renvoie vers la fiche produit de la boutique ;
- un **bloc d'appel** en bas de page : un QR code vers la boutique et une phrase
  d'invitation. C'est la contrepartie commerciale du freebie, sur le seul objet
  qui en sort et qui reste affiché plusieurs jours ;
- logo et adresse du site en pied de page.

Le texte du bloc d'appel vit dans `app/donnees.js`, comme le reste des contenus.
*(Prénom et bloc d'appel ajoutés le 31/08/2026.)*

## 5 bis. L'image à montrer

Distincte de la fiche, et d'un autre métier : la fiche sert à maquiller, l'image
sert à montrer. Le visage maquillé seul, au format 4/5, avec le prénom en titre.

La marque est **gravée dans l'image** — logo et compte Instagram — parce
qu'aucun réseau ne reprend la légende qu'un site lui propose : seule l'image
voyage.

Sur téléphone, le bouton ouvre la **fenêtre de partage native**, d'où l'on
choisit Instagram en un geste. Publier directement n'est pas possible : aucun
site web ne peut le faire, Instagram ne l'autorise pas. Sur ordinateur, la
fenêtre n'existe pas et l'image est simplement enregistrée.

*(Ajouté le 31/08/2026.)*

## 6. Sauvegarde et protection du travail

Sauvegarde continue dans le navigateur (`localStorage`), sans compte.

- Le travail survit à la fermeture de l'onglet et à la mise en veille.
- **Un seul maquillage, valable pour tous les visages** : changer d'enfant
  montre la même composition sur une autre tête, pour comparer un même look.
- Outil « Tout effacer » pour repartir d'un visage nu.

La gomme est rangée **dans la forme qu'elle entame**, exprimée dans le repère
propre de celle-ci. Une forme mordue garde donc sa morsure quand on la déplace
ou qu'on la fait pivoter, au lieu de laisser un trou figé sur le visage.

**Rappel avant de quitter**, si la personne a dessiné sans avoir téléchargé :

- un rappel visible *dans* l'application, dont on maîtrise le texte ;
- **plus** l'avertissement natif du navigateur au moment de fermer l'onglet.
  Son texte n'est pas personnalisable (les navigateurs imposent le leur) et il
  ne se déclenche qu'après une vraie interaction avec la page.

## 7. Évolutivité

Ajouter un visage, une planche de pochoirs, une couleur ou un kit = déposer les
fichiers et ajouter quelques lignes dans un fichier de configuration lisible,
sans toucher au code de l'application. Mode d'emploi fourni.

## 8. Hors périmètre (v1)

Dégradés deux couleurs · comptes utilisateurs · galerie publique · impression
directe depuis l'application (le PDF suffit).

Deux points sont sortis de cette liste en cours de route : les **paillettes**
des fards nacrés, rendues par un semis de micro-points, et le **partage sur les
réseaux** (§5 bis).

## 9. En attente de Lauryne

- [ ] Les **vrais noms des kits** A, B et C, et les adresses de leurs fiches
- [ ] Le nom commercial de la planche « Pochoir Av1 »
- [ ] Le **rendu réel des 9 couleurs** (photo de swatchs à la lumière du jour)
- [ ] Le choix de la version du **visage du crâne**
- [ ] Visuels finaux de l'illustratrice (les 2 brouillons suffisent pour l'instant)
