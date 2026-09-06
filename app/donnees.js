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

   Le cadre ci-dessous contient les cinq dessins réunis, marge comprise. Sa
   HAUTEUR est dictée par le plus encombrant : le foulard de Nour descend
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
    id: 'lou',
    nom: 'Lou',
    image: 'images/visages/lou.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    id: 'noe',
    nom: 'Noé',
    image: 'images/visages/noe.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    /* L'ORDRE DE CETTE LISTE est celui de la galerie. On alterne une fille et
       un garçon, pour que personne n'ait l'impression que la page s'adresse
       d'abord aux uns ou aux autres. */
    id: 'nour',
    nom: 'Nour',
    image: 'images/visages/nour.jpg',
    taille: { w: 1400, h: 1753 },
    cadre:  { x: -21, y: 89, w: 1477, h: 1551 },
    visage: { gauche: 243, droite: 1176, ligneYeux: 828 }
  },
  {
    /* `id` sert de clé aux prénoms que les gens enregistrent dans leur
       navigateur : `nom` se change librement, `id` non. */
    id: 'milo',
    nom: 'Milo',
    image: 'images/visages/milo.jpg',
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
    /* Montré au survol, sur cette carte-là uniquement. */
    survol: 'Une toile entièrement vierge pour ne laisser aucune limite à ' +
            'ton imagination !',
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
   outils/diag2.html pour les visualiser et les numéroter).

   L'ORDRE COMPTE, deux fois : celui des sets est celui des rubriques dans le
   tiroir des pochoirs, celui des formes est celui des vignettes à l'intérieur.
   On va donc du plus simple au plus thématique, et dans chaque planche du
   motif qu'on pose le plus souvent au bord qu'on pose le moins.

   `nom` est le titre affiché ; il se change librement. `id` non : c'est lui
   qui relie un maquillage déjà enregistré à sa forme. */
var POCHOIRS = [
  {
    id: '1v1',
    nom: 'Basique',
    lien: 'https://www.labaguettemaquille.fr',
    planche: '1v1',

    /* Ce fichier n'est pas à l'échelle, contrairement à celui de la planche
       av1 : il mesure 175,7 x 248,9 mm pour une planche qui en fait 120 x 170.
       On le ramène donc à sa taille réelle. Le rapport est le même en largeur
       (120/175,7) et en hauteur (170/248,9), ce qui confirme un simple
       agrandissement du dessin. */
    echelle: 0.683,

    /* Cette planche est la plus grande des deux : 175,7 x 248,9 mm.

       Plusieurs motifs y figurent en double ou en triple, à des tailles
       différentes : comme on peut redimensionner un tampon, on ne déclare que
       le plus grand exemplaire, qui a la meilleure définition. */

    /* `rotBase` présente la forme dans le sens où on l'emploie, alors qu'elle
       est couchée ou retournée sur la planche. En radians : Math.PI vaut un
       demi-tour, et un angle positif tourne dans le sens des aiguilles. */
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

      /* Huit étoiles de trois tailles, semées sur la planche. On garde leurs
         positions les unes par rapport aux autres : c'est le semis qui fait le
         motif, comme les bulles de chaudron de l'autre planche. */
      { id: 'etincelles', nom: 'Étincelles',
        traces: [6, 11, 8, 13, 15, 7, 10, 16] },

      { id: 'rond',   nom: 'Rond',   traces: [9] },

      /* Grand axe vertical sur la planche, couché ici. */
      { id: 'ovale',  nom: 'Ovale',  traces: [5],
        rotBase: Math.PI / 2 },

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
  },

  {
    id: 'av1',
    nom: 'Dans la cabane de la sorcière',
    lien: 'https://www.labaguettemaquille.fr',
    planche: 'av1',
    formes: [
      { id: 'chapeau',  nom: 'Chapeau de sorcière', traces: [2],
        rotBase: 66 * Math.PI / 180 },
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

      { id: 'toile',    nom: "Toile d'araignée",   traces: [1],
        rotBase: Math.PI },
      { id: 'araignee', nom: 'Araignée',           traces: [8] },

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
  }
];

/* ---------------------------------------------------- BAS DE LA FICHE */
/* Le bloc d'appel imprimé sous la liste du matériel. C'est la contrepartie
   commerciale du freebie : la fiche reste affichée plusieurs jours, et c'est
   le seul endroit du projet qui sort de l'écran.

   `qr` attend l'adresse que le code renverra. Tant qu'elle vaut null, la fiche
   imprime un emplacement réservé à la bonne taille : la mise en page est déjà
   celle qu'on aura, sans promettre un code qui ne marche pas encore. */
var APPEL_FICHE = {
  titre: 'Tout le matériel en un scan',
  texte: 'Scanne ce code pour retrouver sur la boutique les couleurs et les ' +
         'pochoirs de ce maquillage.',
  qr: null
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
  siteNom: 'labaguettemaquille.fr',
  siteLien: 'https://www.labaguettemaquille.fr',
  /* Gravé dans l'image à partager : c'est la seule chose qui voyage avec elle,
     puisque les réseaux ne reprennent pas la légende qu'on leur propose. */
  instagram: '@labaguettemaquille'
};
