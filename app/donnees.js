/* =========================================================================
   DONNÉES DU FREEBIE — c'est LE fichier à modifier pour faire évoluer
   l'application : couleurs, kits, visages, pochoirs.
   Aucune autre partie du code n'a besoin d'être touchée.
   Mode d'emploi détaillé : MODE-EMPLOI.md
   ========================================================================= */

/* ------------------------------------------------------------------ KITS */
/* Un kit = un produit vendu contenant plusieurs couleurs.
   Une couleur peut appartenir à plusieurs kits.

   Chaque kit porte LE MÊME NOM que sa planche de pochoirs, plus bas dans
   POCHOIRS (A = av2, B = bv2, C = cv2). Si tu en renommes un, renomme
   l'autre. Noms posés le 26/09/2026, « Petits farceurs » corrigé le
   30/09/2026 pour suivre la boutique.

   lien     : la fiche du kit sur la boutique. Tant que la boutique est
              protégée par mot de passe, ces liens ouvrent la page de mot de
              passe. Toujours en .store : le .fr mène encore à la page
              d'attente systeme.io.
   variante : le numéro de variante Shopify, celui que le QR code met au
              panier. ATTENTION : supprimer puis recréer un produit dans
              Shopify lui donne un nouveau numéro — il faut alors le reporter
              ici. */
var KITS = [
  { id: 'A', nom: 'Dans la forêt enchantée',
    lien: 'https://labaguettemaquille.store/products/kit-dans-la-foret-enchantee',
    variante: '55488833225033' },
  { id: 'B', nom: 'Petits farceurs',
    lien: 'https://labaguettemaquille.store/products/kit-petits-farceurs',
    variante: '55488833651017' },
  { id: 'C', nom: 'Festival de couleurs',
    lien: 'https://labaguettemaquille.store/products/kit-festival-de-couleurs',
    variante: '55488833782089' }
];

/* ------------------------------------------------------------- BOUTIQUE */
/* Les réglages du panier que remplit le QR code de la fiche.

   Le QR code ne contient PAS l'adresse Shopify : il mène à la page relais
   (`relais`, le fichier panier.html de cette appli), qui fabrique le panier
   AU MOMENT DU SCAN avec les réglages ci-dessous. Changer un réglage ici
   corrige donc aussi les fiches déjà imprimées.

   precommande : le numéro du « plan de vente » STOQ (« Précommande
                 Halloween »). Chaque article du panier le porte : sans lui,
                 la cliente serait débitée tout de suite au lieu de
                 précommander.
                 Quand l'offre est désactivée dans STOQ, mets null LE JOUR
                 MÊME : un numéro de plan qui n'existe plus fait échouer le
                 panier. Et après toute modification de l'offre dans STOQ,
                 fais revérifier le numéro (il change si l'offre est
                 supprimée puis recréée).

   Le pochoir Papillon n'est plus mis au panier (01/10/2026) : il est glissé
   en surprise dans le colis.

   CE QUI VA AU PANIER (choisi le 01/10/2026) :
     1. le kit de chaque planche dont on a posé un motif ;
     2. pour les autres couleurs, le kit dès que `kitDes` de ses couleurs
        sont employées (2 : deux couleurs du même kit valent bien le kit,
        qui apporte en plus sa planche et ses pinceaux) ;
     3. sinon, chaque couleur en flacon à l'unité.
   Un maquillage fait sans aucun pochoir ne reçoit donc que des flacons, sauf
   s'il emploie `kitDes` couleurs d'un même kit. */
var BOUTIQUE = {
  adresse: 'https://labaguettemaquille.store',
  relais: 'https://laurynebaguet.github.io/freebie-facechart/panier.html',
  precommande: '692492239177',
  kitDes: 2
};

/* -------------------------------------------------------------- COULEURS */
/* hex   : la teinte telle qu'elle rend UNE FOIS APPLIQUÉE sur la peau.
   nacre : true pour les fards légèrement pailletés. Ils sont regroupés à part
           dans la palette et reçoivent un reflet, à l'écran comme sur la fiche.
   kits  : les kits dans lesquels on trouve cette couleur.
   ref   : usage interne, jamais affiché à l'utilisateur.
   variante : le numéro Shopify du flacon vendu à l'unité (page FLACONS,
           ci-dessous), mis au panier quand le kit n'est pas proposé.

   L'ordre de cette liste est celui de la palette.

   Les teintes viennent des swatchs photographiés sur peau le 21/08/2026, à la
   lumière du jour, avec une feuille blanche dans le cadre : seule la dominante
   de lumière a été corrigée, pas la luminosité, pour ne rien saturer.
   Deux exceptions, posées à la main :
     - le blanc, dont le swatch a été fait après le noir et ressortait grisé ;
     - le noir, que la lumière du jour surexpose et éclaircit à tort ;
     - le doré, dont le flacon n'était pas encore livré : valeur estimée. */
var COULEURS = [
  { id: 'noir',    nom: "Noir d'encre",     hex: '#2B2A2C', ref: '10',   kits: ['B'],
    variante: '55447496261961' },
  { id: 'blanc',   nom: 'Blanc de lune',    hex: '#F2EFE8', ref: '21',   kits: ['B'],
    variante: '55447496294729' },

  { id: 'rouge',   nom: 'Rouge coquelicot', hex: '#E9401D', ref: '159',  kits: ['C'],
    variante: '55447496327497' },
  { id: 'jaune',   nom: 'Jaune soleil',     hex: '#EAAE01', ref: '58',   kits: ['C'],
    variante: '55447496360265' },
  { id: 'bleu',    nom: 'Bleu océan',       hex: '#11439B', ref: '28',   kits: ['C'],
    variante: '55447496393033' },

  { id: 'violet',  nom: 'Violet lavande',   hex: '#9A5CA8', ref: '27',   kits: ['A'],
    variante: '55447496425801' },
  { id: 'vert',    nom: 'Vert grenouille',  hex: '#769469', ref: '49',   kits: ['A'],
    variante: '55447496458569' },

  { id: 'bronze',  nom: 'Bronze ancien',    hex: '#7A6244', ref: '8008', kits: ['A'], nacre: true,
    variante: '55447496491337' },
  /* « Or paille », comme en boutique (anciennement « Paille d'or »). */
  { id: 'or',      nom: 'Or paille',        hex: '#D9B463', ref: '09',   kits: ['B'], nacre: true,
    variante: '55447496524105' }
];

/* La page des flacons vendus à l'unité : `?variant=` suivi du numéro d'une
   couleur l'ouvre directement sur elle. */
var FLACONS = 'https://labaguettemaquille.store/products/flacon-de-maquillage';


/* --------------------------------------------------------------- VISAGES */
/* nom     : prénom proposé par défaut. Chacun peut le remplacer par celui de
             son enfant ; ce choix-là reste dans son navigateur, ce fichier
             ne bouge pas.
   image   : chemin du fichier.
   taille  : dimensions du fichier image, en pixels.
   cadre   : zone de l'image à afficher, en pixels de l'image d'origine.
             Sert à recadrer sans retoucher le fichier. Il a le droit de
             DÉBORDER du fichier (x négatif, largeur plus grande que l'image) :
             c'est ainsi qu'on ménage une marge autour d'un dessin qui touche
             déjà les bords de son fichier. Le vide se remplit de blanc.
   visage  : repères anatomiques DANS LE CADRE, en pixels.
             `gauche` et `droite` sont les tempes, et c'est le SEUL couple qui
             compte : leur écart vaut LARGEUR_VISAGE_MM, ce qui règle la taille
             de tous les pochoirs. `ligneYeux` ne sert qu'à s'y retrouver, le
             code ne le lit pas. */
/* CADRE ET REPÈRES COMMUNS — à garder identiques d'un visage à l'autre.

   Pauline dessine tous les visages sur la même base : même taille de fichier,
   tête au même endroit et à la même échelle. Vérifié le 02/09/2026, les yeux
   tombent à trois pixels près sur les trois dessins.

   On leur donne donc le MÊME cadre et les MÊMES repères, et ce n'est pas
   qu'une question de propreté : le maquillage est un seul dessin, rangé en
   millimètres depuis le coin du cadre, et il suit quand on change d'enfant.
   Cadre commun = un motif posé sur la joue de l'un retombe sur la joue de
   l'autre. Cadres différents = il se décale.

   Le cadre ci-dessous contient les six dessins réunis, marge comprise. Sa
   HAUTEUR est dictée par le plus encombrant : le foulard de Yasmine descend
   jusqu'à y 1615, bien plus bas que les autres nuques (vers 1451). Les autres
   visages ont donc un peu de blanc sous le menton — c'est le prix du cadre
   commun, et il est modeste.

   Un visage aux cheveux discrets occupe moins de place là-dedans qu'un visage
   à grosses couettes : c'est voulu, sa tête n'est pas plus petite pour autant.

   Si un jour un dessin déborde encore par le bas, il suffit d'augmenter `h`
   partout : `x` et `y` NE DOIVENT PAS bouger, ce sont eux qui ancrent le
   maquillage déjà enregistré chez les gens.

   Si un jour un dessin arrive sur une AUTRE base, donne-lui son propre cadre
   et ses propres repères plutôt que ceux-ci. */
var VISAGES = [
  {
    id: 'zoe',
    nom: 'Zoé',
    image: 'images/visages/zoe.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    id: 'elliott',
    nom: 'Elliott',
    image: 'images/visages/elliott.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    /* L'ORDRE DE CETTE LISTE est celui de la galerie. Les dessins alternent
       fille et garçon, pour que personne n'ait l'impression que la page
       s'adresse d'abord aux uns ou aux autres. Chacun se remplace de toute
       façon par le prénom de son enfant. */
    id: 'yasmine',
    nom: 'Yasmine',
    image: 'images/visages/yasmine.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    /* `id` sert de clé aux prénoms que les gens enregistrent dans leur
       navigateur : `nom` se change librement, `id` non. */
    id: 'gabriel',
    nom: 'Gabriel',
    image: 'images/visages/gabriel.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    id: 'jade',
    nom: 'Jade',
    image: 'images/visages/jade.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    id: 'noah',
    nom: 'Noah',
    image: 'images/visages/noah.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },

  /* LA TOILE VIERGE — une surface nue, pour s'entraîner comme on le ferait
     sur son propre bras avant de maquiller un enfant.

     Elle n'a pas de fichier image : `peau` dit au code de remplir le cadre
     d'une couleur unie, choisie parmi PEAUX un peu plus bas.

     Son cadre a exactement les MÊMES dimensions que celui des visages
     (1477 × 1551) et les mêmes repères. C'est ce qui permet au maquillage de
     passer d'un visage à la toile vierge sans se décaler ni changer de taille.
     Si tu touches un jour au cadre commun des visages, touche à celui-ci de la
     même façon.

     `taille` vaut ici exactement le cadre, et c'est un CHOIX : la couleur
     remplit alors tout le cadre, bord à bord. Un visage, lui, laisse un peu de
     blanc sur les côtés, parce que son fichier est moins large que le cadre
     commun. On a essayé de faire pareil pour la toile, le 06/09/2026 : une
     toile vierge à laquelle il manque une bande n'est plus une toile vierge.
     Si tu veux un jour ce retrait, remets `taille` à { w: 1400, h: 1551 } et
     `cadre.x` à −21 : le moteur découpe la couleur comme il découperait un
     fichier de cette taille-là.

     `titre` remplace « Le maquillage de… » sur la fiche et sur l'image à
     partager : « Le maquillage de Toile vierge » ne voudrait rien dire. */
  {
    id: 'essai',
    nom: 'Toile vierge',
    titre: 'Mon essai de maquillage',
    /* Petite ligne sous le nom, sur cette carte-là uniquement. Elle est
       TOUJOURS visible : au survol seulement, elle se déclenchait au doigt
       dès qu'on faisait défiler la page en touchant la carte. */
    sous: 'pour laisser libre cours à ton imagination',
    peau: true,
    taille: { w: 1477, h: 1551 },
    cadre:  { x: 0, y: 0, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176 }
  }
];

/* Largeur que représente le visage dessiné, d'une tempe à l'autre, en
   millimètres. C'est LA valeur qui règle la taille de tous les pochoirs.

   Valeur réglée à l'œil par Lauryne avec outils/echelle.html. Elle absorbe
   aussi l'imprécision du placement des repères `visage` ci-dessus : seul
   compte le rendu final. Augmente ce nombre pour rapetisser tous les pochoirs
   d'un coup, diminue-le pour les grossir. */
var LARGEUR_VISAGE_MM = 180;

/* ----------------------------------------------------------------- PEAUX */
/* Les fonds proposés sous la carte « Toile vierge » de la galerie.

   Le premier de la liste est celui qu'on voit en arrivant : le blanc, parce
   qu'une page blanche est ce qu'on attend d'un essai, et parce que c'est là
   que les couleurs se lisent le plus franchement.

   Les autres sont des teintes de peau, de la plus claire à la plus foncée.
   Ce sont des valeurs d'atelier, choisies pour couvrir l'éventail sans
   prétendre à une charte : elles se retouchent librement ici, une par une,
   sans toucher au reste du code. Un fard rendu sur ces fonds ne remplace pas
   un vrai essai sur la peau, il donne une idée. */
var PEAUX = [
  { id: 'blanc',    nom: 'Blanc',      hex: '#FFFFFF' },
  { id: 'porcelaine', nom: 'Porcelaine', hex: '#F6DFCD' },
  { id: 'sable',    nom: 'Sable',      hex: '#EFC8A2' },
  { id: 'miel',     nom: 'Miel',       hex: '#DFA871' },
  { id: 'caramel',  nom: 'Caramel',    hex: '#C0824C' },
  { id: 'cannelle', nom: 'Cannelle',   hex: '#8D5524' },
  { id: 'ebene',    nom: 'Ébène',      hex: '#5B3A22' }
];

/* -------------------------------------------------------------- POCHOIRS */
/* Un set = une planche physique. Une forme = un motif qu'on tamponne.
   « traces » liste les numéros de sous-chemins de la planche (voir
   outils/diag-planche.html?p=av2 pour les visualiser et les numéroter).

   L'ORDRE COMPTE, deux fois : celui des sets est celui des rubriques dans le
   tiroir des pochoirs, celui des formes est celui des vignettes à l'intérieur.
   On va donc du plus simple au plus thématique, et dans chaque planche du
   motif qu'on pose le plus souvent au bord qu'on pose le moins.

   `nom` est le titre affiché ; il se change librement. `id` non : c'est lui
   qui relie un maquillage déjà enregistré à sa forme. */
var POCHOIRS = [
  {
    id: 'av2',
    /* Même nom que le kit A, et vendue dedans : `kit` la fait mettre au
       panier par le QR code de la fiche. */
    kit: 'A',
    nom: 'Dans la forêt enchantée',
    lien: 'https://labaguettemaquille.store/products/pochoir?variant=55281667080521',
    planche: 'av2',

    /* Pas d'`echelle` ici : le tracé de cette planche est déjà recomposé à la
       bonne taille, forme par forme, par outils/recomposer.html?p=av2. Les
       tailles y ont été relevées sur les maquillages d'essai de Lauryne sur
       Jade (13/09/2026). Pour en retoucher une, c'est là-bas qu'on le fait. */
    formes: [
      { id: 'chapeau',  nom: 'Chapeau de sorcière', traces: [0] },
      { id: 'araignee', nom: 'Araignée',            traces: [1] },

      /* Les sept écailles restent un seul tampon, comme sur le plastique :
         chacun gomme ensuite celles qui sont en trop. */
      { id: 'ecailles', nom: 'Écailles', traces: [2, 3, 4, 5, 6, 7, 8] },

      /* Le même pochoir sert de croc et de corne. */
      { id: 'croc',     nom: 'Croc ou corne',       traces: [9] },

      /* Quatre fleurs au choix pour la couronne (les deux dernières ajoutées
         le 13/09/2026), et un rond pour leur cœur. */
      { id: 'fleur',    nom: 'Fleur',               traces: [10] },
      { id: 'fleur-2',  nom: 'Fleur festonnée',     traces: [11] },
      { id: 'fleur-3',  nom: 'Fleur à huit pétales', traces: [22] },
      { id: 'fleur-4',  nom: 'Marguerite',          traces: [23] },
      { id: 'coeur-fleur', nom: 'Cœur de fleur',    traces: [25] },

      /* Ces deux feuilles sont découpées DROITES sur la planche, mais l'appli
         les présente penchées de 45°, comme on les pose (`rotBase`, en
         radians, sens des aiguilles). La fiche du fournisseur, elle, les
         montre telles qu'elles sont découpées. */
      { id: 'feuille',  nom: 'Feuille',             traces: [12],
        rotBase: Math.PI / 4 },
      { id: 'feuilles', nom: 'Feuille double',      traces: [13] },
      { id: 'feuille-dentelee', nom: 'Feuille dentelée', traces: [24],
        rotBase: Math.PI / 4 },

      /* Huit étoiles en un seul tampon : deux grandes (pochoir 7a), trois
         petites et trois très petites (pochoir 7b). Le semis est celui de la
         joue gauche ; « Retourner » donne celui de la joue droite. */
      { id: 'etoiles',  nom: 'Étincelles',          traces: [14, 15, 16, 17, 18, 19, 20, 21] }
    ]
  },

  {
    id: 'bv2',
    /* Même nom que le kit B, et vendue dedans. */
    kit: 'B',
    nom: 'Petits farceurs',
    lien: 'https://labaguettemaquille.store/products/pochoir?variant=55281667113289',
    planche: 'bv2',

    /* Comme av2 : tracé déjà à la bonne taille, recomposé par
       outils/recomposer.html?p=bv2 d'après les essais sur Jade (13/09/2026). */
    formes: [
      /* Le pirate. Le crâne, ses os et son visage se posent dans le chapeau ;
         ils restent trois tampons pour autoriser trois couleurs. */
      { id: 'chapeau-pirate', nom: 'Chapeau de pirate', traces: [1] },
      { id: 'os',             nom: 'Os croisés',        traces: [2] },
      { id: 'crane',          nom: 'Crâne',             traces: [3] },
      { id: 'visage-crane',   nom: 'Visage du crâne',   traces: [4, 5, 6] },
      { id: 'bandeau',        nom: 'Bandeau de pirate', traces: [0] },

      /* Trois moustaches et deux boucs, pour personnaliser. Une moustache est
         une moitié : « Retourner » donne l'autre. */
      { id: 'moustache-1',    nom: 'Moustache bouclée', traces: [7] },
      { id: 'moustache-2',    nom: 'Moustache effilée', traces: [8] },
      { id: 'moustache-3',    nom: 'Moustache tombante', traces: [9] },
      { id: 'bouc-1',         nom: 'Bouc',              traces: [10] },
      { id: 'bouc-2',         nom: 'Bouc arrondi',      traces: [11] },

      { id: 'nez-chat',       nom: 'Nez de chat',       traces: [12] },

      /* La nuit fantôme, choisie le 13/09/2026. Le fantôme est assez grand
         pour recevoir le visage du crâne. Les deux chauves-souris et les
         trois étoiles sont chacune un seul tampon. */
      { id: 'lune',           nom: 'Lune',              traces: [13] },
      { id: 'fantome',        nom: 'Fantôme',           traces: [14] },
      { id: 'chauves-souris', nom: 'Chauves-souris',    traces: [15, 16] },
      { id: 'trois-etoiles',  nom: 'Étoiles',           traces: [17, 18, 19] }
    ]
  },

  {
    id: 'cv2',
    /* Même nom que le kit C, et vendue dedans. */
    kit: 'C',
    nom: 'Festival de couleurs',
    lien: 'https://labaguettemaquille.store/products/pochoir?variant=55281667146057',
    planche: 'cv2',

    /* Comme av2 : tracé déjà à la bonne taille, recomposé par
       outils/recomposer.html?p=cv2 d'après les essais (13/09/2026). */
    formes: [
      /* La calavera. Le nez du crâne est le cœur de l'ancienne planche Basique,
         retourné pointe en haut. La fleur et la feuille viennent d'av2, en
         plus grand, comme sur le modèle de la calavera. */
      { id: 'tour-oeil',      nom: "Tour de l'œil",   traces: [0] },
      { id: 'nez-crane',      nom: 'Nez du crâne',    traces: [1] },
      { id: 'fleur',          nom: 'Fleur',           traces: [2] },
      { id: 'feuille',        nom: 'Feuille',         traces: [3] },
      { id: 'feuille-triple', nom: 'Feuille triple',  traces: [4] },

      /* La poupée patchwork : deux tailles de patch, et ses boutons. */
      { id: 'patch-grand',    nom: 'Grand patch',     traces: [5] },
      { id: 'patch',          nom: 'Patch',           traces: [6] },
      { id: 'bouton',         nom: 'Bouton',          traces: [7] },

      /* L'alien. L'étoile est celle de l'ancienne planche Basique ; les chevrons
         sont deux traits en un seul tampon. */
      { id: 'oeil',           nom: 'Œil',             traces: [8] },
      { id: 'antenne',        nom: 'Antenne',         traces: [9] },
      { id: 'etoile',         nom: 'Étoile',          traces: [10] },
      { id: 'chevrons',       nom: 'Chevrons',        traces: [11, 12] }
    ]
  },

  {
    id: 'papillon',
    /* Sortie de bv2 le 13/09/2026 : le papillon a sa propre planche,
       rangée en dernier dans le tiroir.

       CACHÉE depuis le 01/10/2026 : le Papillon n'est plus vendu, il est
       glissé en surprise dans les colis. Pour la remettre dans le tiroir
       quand les colis seront arrivés, retire la ligne `cachee: true`.
       Cachée ne veut pas dire effacée : un maquillage déjà fait avec ses
       motifs les garde. */
    cachee: true,
    nom: 'Papillon',
    lien: null,
    planche: 'papillon',
    formes: [
      /* Une aile de chaque sorte, et son motif. Les motifs se découpent d'un
         seul tenant, comme les écailles. « Retourner » donne l'autre côté. */
      { id: 'aile-haut',       nom: 'Aile du haut',            traces: [0] },
      { id: 'aile-bas',        nom: 'Aile du bas',             traces: [1] },
      { id: 'motif-aile-haut', nom: "Motif de l'aile du haut", traces: [2, 3, 4, 5, 6, 7, 8, 9] },
      { id: 'motif-aile-bas',  nom: "Motif de l'aile du bas",  traces: [10, 11, 12, 13, 14, 15, 16] }
    ]
  }
];

/* ---------------------------------------------------- BAS DE LA FICHE */
/* Le bloc d'appel imprimé sous la liste du matériel. C'est la contrepartie
   commerciale du freebie : la fiche reste affichée plusieurs jours, et c'est
   le seul endroit du projet qui sort de l'écran.

   Le QR code se fabrique tout seul, fiche par fiche : il met au panier les
   kits et les flacons dont ce maquillage a besoin (voir BOUTIQUE, plus
   haut). */
var APPEL_FICHE = {
  titre: 'Tout le matériel en un scan',
  texte: 'Scanne ce code pour retrouver dans ton panier tout le matériel de ' +
         'ce maquillage.'
};

/* ----------------------------------------------------------------- TEXTES */
var TEXTES = {
  /* Les espaces de « de la Baguette » sont INSÉCABLES (  et non un espace
     ordinaire) : ces trois mots restent soudés, si bien que le seul endroit où
     le titre peut se couper est juste avant eux. Il tient donc sur une ligne
     quand la place le permet, et passe à deux en coupant entre « magique » et
     « de », jamais ailleurs. La première moitié garde des espaces normaux : sur
     un téléphone très étroit, elle a ainsi le droit de se replier à son tour
     plutôt que de déborder de l'écran. */
  titre: 'Le petit atelier magique de la Baguette',

  /* Deux phrases, deux lignes : la première dit ce qu'on va faire, la seconde
     ce qu'on en rapporte. */
  accroche: 'Choisis un visage, pose tes pochoirs, joue avec les couleurs, ' +
            "efface et recommence à l'infini !",
  /* « Quand le résultat te plaît » plutôt que « quand tu es content » : rien
     n'y porte de genre, et la phrase se lit aussi bien par une fille que par
     un garçon. */
  accrocheSuite: 'Quand le résultat te plaît, partage-nous ton œuvre ou ' +
                 'imprime ta fiche mémo 😊',

  /* Espace insécable avant le point d'exclamation : c'est la règle en
     français, et ça empêche le « ! » de se retrouver seul en bout de ligne. */
  boutonDemarrer: "C'est parti !",
  /* Titre de la page des visages. Un seul, qu'on y vienne pour la première
     fois ou qu'on revienne en changer : la phrase marche dans les deux cas,
     et l'écran n'a plus besoin de s'expliquer. */
  titreGalerie: 'Choisis ton visage à maquiller',
  /* Titre de la fiche et de l'image. Deux formes, parce que le « de » s'élide
     devant une voyelle : « Le maquillage d'Anna ». */
  titreDe: 'Le maquillage de ',
  titreElide: "Le maquillage d'",
  /* Les visages sont son travail : le crédit apparaît sur l'accueil et sur la
     fiche imprimée. Ajoute son adresse si elle en veut une. */
  credit: 'Visages illustrés par Pauline Dussert',
  siteNom: 'labaguettemaquille.store',
  siteLien: 'https://labaguettemaquille.store',
  /* Gravé dans l'image à partager : c'est la seule chose qui voyage avec elle,
     puisque les réseaux ne reprennent pas la légende qu'on leur propose. */
  instagram: '@labaguettemaquille'
};
