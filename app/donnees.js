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

    /* ATTENTION — noms provisoires, à remplacer par les vrais.
       Cette planche est plus grande que la Av1 : 175,7 x 248,9 mm.

       Les formes ont été regroupées en comparant leurs silhouettes : les
       morceaux 6 et 11 sont deux exemplaires du MÊME motif (un seul tampon
       suffit), et les morceaux 9, 12 et 14 sont un même motif décliné en trois
       tailles, comme 7/10/16 et 8/13/15 pour le petit. */
    formes: [
      { id: 'f1', nom: 'Forme 1',  traces: [1] },   /* 21,9 x 25,8 mm */
      { id: 'f2', nom: 'Forme 2',  traces: [2] },   /* 48,7 x 50,9 mm */
      { id: 'f3', nom: 'Forme 3',  traces: [3] },   /* 27,3 x 33,4 mm */
      { id: 'f4', nom: 'Forme 4',  traces: [4] },   /* 39,2 x 48,8 mm */
      { id: 'f5', nom: 'Forme 5',  traces: [5] },   /* 27,3 x 48,9 mm */
      { id: 'ajoure', nom: 'Motif ajouré', traces: [6] },  /* 33,6 mm, en double sur la planche */

      { id: 'rond-grand', nom: 'Grand rond',  traces: [9] },   /* 43,1 mm */
      { id: 'rond-moyen', nom: 'Rond moyen',  traces: [12] },  /* 24,7 mm */
      { id: 'rond-petit', nom: 'Petit rond',  traces: [14] },  /* 15,6 mm */

      { id: 'semis-moyen', nom: 'Petit motif', traces: [8] },  /* 9,0 mm, en triple */
      { id: 'semis-petit', nom: 'Micro motif', traces: [7] },  /* 5,4 mm, en triple */

      /* Deux bords travaillés, tous deux très réguliers. Comme pour la Av1, la
         fenêtre va d'un creux à un creux pour que le motif se répète trois fois
         à l'identique, sans morceau orphelin au bout. */
      { id: 'bord-droit', nom: 'Bordure vagues', traces: [0],
        /* période 24,5 mm, creux à 51,5 / 76 / 100,5 / 125 */
        bande: { x: 181, y: 51.5, w: 15, h: 73.5 } },
      { id: 'bord-bas', nom: 'Bordure festons', traces: [0],
        /* Période 35 mm. On part d'un CREUX de peinture (62 / 97 / 132 / 166)
           et non d'une pointe : sinon le motif commence et finit par un demi
           feston collé au bord. */
        bande: { x: 62, y: 268, w: 104, h: 12 } }
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
