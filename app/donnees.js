/* =========================================================================
   DONNÉES DU FREEBIE — c'est LE fichier à modifier pour faire évoluer
   l'application : couleurs, kits, visages, pochoirs.
   Aucune autre partie du code n'a besoin d'être touchée.
   Mode d'emploi détaillé : MODE-EMPLOI.md
   ========================================================================= */

/* ------------------------------------------------------------------ KITS */
/* Un kit = un produit vendu contenant plusieurs couleurs.
   Une couleur peut appartenir à plusieurs kits. */
var KITS = [
  { id: 'A', nom: 'Kit A', lien: 'https://www.labaguettemaquille.fr' },
  { id: 'B', nom: 'Kit B', lien: 'https://www.labaguettemaquille.fr' },
  { id: 'C', nom: 'Kit C', lien: 'https://www.labaguettemaquille.fr' }
];

/* -------------------------------------------------------------- COULEURS */
/* hex   : la teinte telle qu'elle rend UNE FOIS APPLIQUÉE sur la peau.
   nacre : true pour les fards légèrement pailletés. Ils sont regroupés à part
           dans la palette et reçoivent un reflet, à l'écran comme sur la fiche.
   kits  : les kits dans lesquels on trouve cette couleur.
   ref   : usage interne, jamais affiché à l'utilisateur.

   L'ordre de cette liste est celui de la palette.

   Les teintes viennent des swatchs photographiés sur peau le 21/08/2026, à la
   lumière du jour, avec une feuille blanche dans le cadre : seule la dominante
   de lumière a été corrigée, pas la luminosité, pour ne rien saturer.
   Deux exceptions, posées à la main :
     - le blanc, dont le swatch a été fait après le noir et ressortait grisé ;
     - le noir, que la lumière du jour surexpose et éclaircit à tort ;
     - le doré, dont le flacon n'était pas encore livré : valeur estimée. */
var COULEURS = [
  { id: 'noir',    nom: "Noir d'encre",     hex: '#2B2A2C', ref: '10',   kits: ['B'] },
  { id: 'blanc',   nom: 'Blanc de lune',    hex: '#F2EFE8', ref: '21',   kits: ['B'] },

  { id: 'rouge',   nom: 'Rouge coquelicot', hex: '#E9401D', ref: '159',  kits: ['C'] },
  { id: 'jaune',   nom: 'Jaune soleil',     hex: '#EAAE01', ref: '58',   kits: ['C'] },
  { id: 'bleu',    nom: 'Bleu océan',       hex: '#11439B', ref: '28',   kits: ['C'] },

  { id: 'violet',  nom: 'Violet lavande',   hex: '#9A5CA8', ref: '27',   kits: ['A'] },
  { id: 'vert',    nom: 'Vert grenouille',  hex: '#769469', ref: '49',   kits: ['A'] },

  { id: 'bronze',  nom: 'Bronze ancien',    hex: '#7A6244', ref: '8008', kits: ['A'], nacre: true },
  { id: 'or',      nom: "Paille d'or",      hex: '#D9B463', ref: '09',   kits: ['B'], nacre: true }
];


/* --------------------------------------------------------------- VISAGES */
/* image   : chemin du fichier.
   taille  : dimensions du fichier image, en pixels.
   cadre   : zone de l'image à afficher, en pixels de l'image d'origine.
             Sert à recadrer sans retoucher le fichier.
   visage  : repères anatomiques DANS LE CADRE, en pixels :
             gauche/droite = les tempes, hauteur = ligne des yeux.
             C'est ce qui donne l'échelle réelle des pochoirs. */
var VISAGES = [
  {
    id: 'lou',
    nom: 'Lou',
    image: 'images/visages/visage1.jpg',
    taille: { w: 1080, h: 1440 },
    cadre:  { x: 110, y: 210, w: 880, h: 1080 },
    visage: { gauche: 120, droite: 745, ligneYeux: 590 }
  },
  {
    id: 'noe',
    nom: 'Noé',
    image: 'images/visages/visage2.jpg',
    taille: { w: 1080, h: 1440 },
    cadre:  { x: 130, y: 250, w: 860, h: 1050 },
    visage: { gauche: 65, droite: 720, ligneYeux: 490 }
  }
];

/* Largeur que représente le visage dessiné, d'une tempe à l'autre, en
   millimètres. C'est LA valeur qui règle la taille de tous les pochoirs.

   Valeur réglée à l'œil par Lauryne avec outils/echelle.html. Elle absorbe
   aussi l'imprécision du placement des repères `visage` ci-dessus : seul
   compte le rendu final. Augmente ce nombre pour rapetisser tous les pochoirs
   d'un coup, diminue-le pour les grossir. */
var LARGEUR_VISAGE_MM = 180;

/* -------------------------------------------------------------- POCHOIRS */
/* Un set = une planche physique. Une forme = un motif qu'on tamponne.
   « traces » liste les numéros de sous-chemins de la planche (voir
   outils/diag2.html pour les visualiser et les numéroter). */
var POCHOIRS = [
  {
    id: 'av1',
    nom: 'Planche Av1',
    lien: 'https://www.labaguettemaquille.fr',
    planche: 'av1',
    /* `rotBase` présente la forme dans le sens où on l'emploie, alors qu'elle
       est couchée ou retournée sur la planche. En radians : Math.PI vaut un
       demi-tour, et un angle positif tourne dans le sens des aiguilles. */
    formes: [
      { id: 'toile',    nom: "Toile d'araignée",   traces: [1],
        rotBase: Math.PI },
      { id: 'chapeau',  nom: 'Chapeau de sorcière', traces: [2],
        rotBase: 66 * Math.PI / 180 },
      { id: 'araignee', nom: 'Araignée',           traces: [8] },
      { id: 'fiole',    nom: 'Fiole de potion',    traces: [10] },
      { id: 'crane',    nom: 'Crâne',              traces: [4] },

      /* Les yeux et le nez du crâne sont découpés à trois endroits éloignés de
         la planche, pour que le plastique tienne. On les recompose ici dans la
         position où on les emploie vraiment. Les deux yeux sont taillés en
         amande, inclinés symétriquement : il faut donc les garder chacun de
         son côté, sans les faire pivoter. */
      { id: 'visage-crane', nom: 'Visage du crâne', traces: [
          { t: 15, dx: 40.79, dy: 93.18 },   /* œil gauche, incliné à -57° */
          { t: 13, dx: 47.59, dy: 85.08 },   /* œil droit,  incliné à +57° */
          { t: 14, dx: 41.66, dy: 93.26,     /* nez, redressé d'un quart   */
            rot: Math.PI / 2 }
        ] },

      { id: 'bulles',   nom: 'Bulles de chaudron', traces: [3, 5, 6, 7, 9, 11, 12] },

      /* Bords de la planche : ce ne sont pas des motifs découpés, on pose le
         bord et la peinture passe autour. « bande » délimite la fenêtre, et
         ses limites sont choisies pour tomber dans le plastique, sinon on
         fabrique des bords qui n'existent pas sur le vrai pochoir. */
      { id: 'coulures', nom: 'Coulures', traces: [0],
        /* le bord droit s'arrête à 172,5 : au-delà, le plastique s'incurve et
           laissait passer un mince trait de peinture qui n'existe pas */
        bande: { x: 92.5, y: 36, w: 80, h: 50 } },
      { id: 'dents',    nom: 'Dents de scie', traces: [0],
        /* pointes vers le bas ; seul le motif tourne, son cadre reste droit */
        rotBase: Math.PI / 2,
        /* Trois doubles montagnes, et rien de plus. Le bord alterne une grande
           dent et une petite ; la fenêtre va d'un creux PROFOND à un creux
           profond, calée au quart de millimètre sur le
           point le plus bas de chacun (61,5 mm et 177 mm sur la planche).
           Dépasser ne serait-ce que d'un millimètre fait repartir le bord vers
           le haut et laisse une languette disgracieuse au bout. */
        bande: { x: 52, y: 61.5, w: 17, h: 115.5 } }
    ]
  },

  {
    id: '1v1',
    nom: 'Planche 1v1',
    lien: 'https://www.labaguettemaquille.fr',
    planche: '1v1',

    /* Ce fichier n'est pas à l'échelle, contrairement à celui de la Av1 : il
       mesure 175,7 x 248,9 mm pour une planche qui en fait 120 x 170. On le
       ramène donc à sa taille réelle. Le rapport est le même en largeur
       (120/175,7) et en hauteur (170/248,9), ce qui confirme un simple
       agrandissement du dessin. */
    echelle: 0.683,

    /* Cette planche est plus grande que la Av1 : 175,7 x 248,9 mm.

       Plusieurs motifs y figurent en double ou en triple, à des tailles
       différentes : comme on peut redimensionner un tampon, on ne déclare que
       le plus grand exemplaire, qui a la meilleure définition. */
    formes: [
      /* Le cœur est découpé trois fois (morceaux 1, 3 et 4). L'échancrure de
         l'exemplaire retenu pointe vers la droite : on le redresse d'un quart
         de tour à gauche pour la ramener en haut, pointe en bas. */
      { id: 'coeur',  nom: 'Cœur',  traces: [4],
        rotBase: -80 * Math.PI / 180 },

      /* Cinq branches, espacées de 72°. La plus haute est à 290° : on ramène
         une branche à la verticale. */
      { id: 'etoile', nom: 'Étoile', traces: [2],
        rotBase: -20 * Math.PI / 180 },

      /* Grand axe vertical sur la planche, couché ici. */
      { id: 'ovale',  nom: 'Ovale',  traces: [5],
        rotBase: Math.PI / 2 },

      { id: 'rond',   nom: 'Rond',   traces: [9] },

      /* Huit étoiles de trois tailles, semées sur la planche. On garde leurs
         positions les unes par rapport aux autres : c'est le semis qui fait le
         motif, comme les bulles de chaudron de la Av1. */
      { id: 'etincelles', nom: 'Étincelles',
        traces: [6, 11, 8, 13, 15, 7, 10, 16] },

      /* La fenêtre d'une bordure va d'un creux à un creux, pour que le motif
         se répète à l'identique sans morceau orphelin au bout. « arrondi »
         casse l'angle droit des extrémités, sans rien estomper.

         Période 35 mm, creux à 62 / 97 / 132 / 166. */
      { id: 'vagues', nom: 'Vagues', traces: [0],
        /* Coupée aux creux (62 et 166), donc trois vagues entières.
           « arrondi » adoucit toute la silhouette, pas seulement les coins de
           la fenêtre : il n'y reste aucun angle vif, ni en haut ni en bas.
           Le rayon vaut la moitié de l'épaisseur de matière aux extrémités
           (6,8 mm) : le bout s'y arrondit donc en demi-cercle de lui-même,
           en rognant, sans rien prolonger. */
        bande: { x: 62, y: 268, w: 104, h: 12, arrondi: 3.4 } }

      /* BORD DROIT — retiré volontairement, en attente d'une planche corrigée.
         Il est découpé en arcs qui BOMBENT vers l'extérieur. Or la peinture
         passe autour du plastique : ces bosses de plastique donnent donc des
         pointes en V peintes, et non les collines voulues. Pour obtenir des
         collines, il faut creuser des encoches arrondies DANS le bord, au lieu
         d'y ajouter des bosses.

         Le moteur sait rendre les deux cas : une bande « positif: true »
         remplit le tracé lui-même au lieu de son pourtour. */
    ]
  }
];

/* ----------------------------------------------------------------- TEXTES */
var TEXTES = {
  titre: 'Imagine le maquillage de ton enfant',
  accroche: 'Choisis un visage, pose tes pochoirs, essaie tes couleurs. ' +
            'Quand tu es content du résultat, repars avec ta fiche à imprimer.',
  boutonDemarrer: "C'est parti",
  siteNom: 'labaguettemaquille.fr',
  siteLien: 'https://www.labaguettemaquille.fr'
};
