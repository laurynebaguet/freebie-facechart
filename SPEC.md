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
- **Taille figée** : elle correspond à la taille physique réelle du pochoir,
  rapportée à la largeur du visage. Non modifiable, volontairement.
- Restent **manipulables indéfiniment** : déplacement, rotation, miroir,
  changement de couleur, suppression.
- Une seule couleur unie par forme (pas de dégradé en v1).
- Une forme sélectionnée porte ses commandes sur elle : un bouton de rotation
  au-dessus, une pastille de suppression au coin. La touche `Suppr` marche
  aussi, `Échap` désélectionne.
- Viser le cadre d'une forme sélectionnée la manipule, même si l'outil Pochoirs
  est actif : on ne pose jamais un motif par-dessus par mégarde.

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

- le facechart maquillé, en grand ;
- la liste des **couleurs** utilisées : nom commercial, pastille, et le ou les
  kits dans lesquels la trouver ;
- la liste des **pochoirs** utilisés (nom du set + nom de la forme) ;
- chaque entrée renvoie vers la fiche produit de la boutique ;
- logo et adresse du site en pied de page.

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

Dégradés deux couleurs · comptes utilisateurs · partage sur les réseaux ·
galerie publique · paillettes et effets de matière · impression directe depuis
l'application (le PDF suffit).

## 9. En attente de Lauryne

- [ ] Les **vrais noms des kits** A, B et C, et les adresses de leurs fiches
- [ ] Le nom commercial de la planche « Pochoir Av1 »
- [ ] Le **rendu réel des 9 couleurs** (photo de swatchs à la lumière du jour)
- [ ] Le choix de la version du **visage du crâne**
- [ ] Visuels finaux de l'illustratrice (les 2 brouillons suffisent pour l'instant)
