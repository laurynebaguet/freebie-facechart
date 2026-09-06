/* Tous les morceaux visibles de l'interface, hors toile de dessin. */
var UI = (function () {
  'use strict';
  var html = htm.bind(React.createElement);
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;

  /* Avec quoi vise-t-on ? Trois cas, parce qu'une tablette n'est ni un
     téléphone ni un ordinateur :

     - souris : les poignées, qu'on vise au pixel près ;
     - téléphone : pas de poignées, elles encombrent un petit écran et on les
       manque ; deux doigts font le travail ;
     - tablette : les DEUX. Le doigt y est aussi imprécis qu'au téléphone, mais
       l'écran est assez grand pour que les poignées ne gênent personne, et on
       s'en sert aussi au stylet.

     Une tablette se reconnaît à son petit côté d'écran : 600 points séparent
     nettement les téléphones (400 à 440) des tablettes (740 et plus). On
     interroge `screen` et non la fenêtre, parce que l'application vit dans un
     cadre intégré dont la taille ne dit rien de l'appareil. */
  var AU_DOIGT = !!(window.matchMedia &&
                    window.matchMedia('(pointer: coarse)').matches);
  /* Le petit côté de l'écran de l'APPAREIL. On interroge `screen` plutôt que
     la fenêtre : dans un cadre intégré, la fenêtre ne dit rien de l'appareil.
     Si `screen` ne répond pas, on se rabat sur la fenêtre, puis sur « grand » —
     dans le doute, mieux vaut afficher des poignées inutiles que d'en priver
     une tablette et de la laisser sans commandes. */
  function petitCoteEcran() {
    var e = window.screen || {};
    var cote = Math.min(e.width || 0, e.height || 0);
    if (cote > 0) return cote;
    return Math.min(window.innerWidth || 0, window.innerHeight || 0) || 9999;
  }

  var AVEC_POIGNEES = !AU_DOIGT || petitCoteEcran() >= 600;

  /* ---------------------------------------------------------- icônes */

  var TRACES = {
    pochoir:  ['M12 2.5 14.6 9h6.9l-5.6 4.1 2.1 6.6L12 15.8 6 19.7l2.1-6.6L2.5 9h6.9z'],
    pinceau:  ['M15.5 3.5a2.1 2.1 0 0 1 3 3L11 14l-3.5.5.5-3.5zM6 15c1.7 0 3 1.3 3 3 0 1.9-1.6 3-4 3H2c1.4-.9 2-1.8 2-3 0-1.7.9-3 2-3z'],
    gomme:    ['M8.5 20H20M4.6 16.2l6.6-6.6 5.2 5.2-4.6 4.6a2 2 0 0 1-2.8 0l-4.4-4.4a2 2 0 0 1 0-2.8zM11.2 9.6l3.4-3.4a2 2 0 0 1 2.8 0l2.4 2.4a2 2 0 0 1 0 2.8l-3.4 3.4'],
    // modifier : quatre flèches de déplacement, plus une flèche de rotation
    modifier: ['M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5'],
    miroir:   ['M12 3v18M8 7 4 12l4 5zM16 7l4 5-4 5z'],
    annuler:  ['M4 9h10a5 5 0 0 1 0 10h-4M4 9l4-4M4 9l4 4'],
    refaire:  ['M20 9H10a5 5 0 0 0 0 10h4m6-10-4-4m4 4-4 4'],
    poubelle: ['M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7M10 11v6M14 11v6'],
    telecharger: ['M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'],
    visages:  ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0'],
    crayon:   ['M5 19h3.4L19.6 7.8a2.1 2.1 0 0 0-3-3L5.4 16z', 'M14.5 6.9l3 3'],
    valider:  ['M5 12.5 10 17.5 19.5 7']
  };

  function Icone(p) {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${TRACES[p.nom].map(function (d, i) { return html`<path key=${i} d=${d}></path>`; })}
      </svg>`;
  }

  /* Vignette d'une forme de pochoir, cadrée sur son motif et redressée. */
  function VignetteForme(p) {
    var f = p.forme;
    // Carré centré sur le motif redressé ; les dimensions tiennent déjà compte
    // de la rotation de présentation. On les ramène à l'échelle du tracé : le
    // facteur propre à la planche s'applique au rendu, pas au fichier.
    var demi = Math.max(f.largeurMm, f.hauteurMm) / 2 * 1.08 / (f.echelleSet || 1);
    var vb = [f.cx - demi, f.cy - demi, demi * 2, demi * 2].join(' ');
    var tourne = f.rotBase
      ? 'rotate(' + (f.rotBase * 180 / Math.PI) + ' ' + f.pivot.x + ' ' + f.pivot.y + ')'
      : null;

    if (f.bande) {
      var b = f.bande;
      // rectangle débordant, comme au rendu, pour éviter le liseré de bord
      var o = f.debord || 0;
      var fenetre = 'M ' + (b.x - o) + ',' + (b.y - o)
                  + ' h ' + (b.w + 2 * o) + ' v ' + (b.h + 2 * o)
                  + ' h ' + (-(b.w + 2 * o)) + ' Z ';
      // Sans ce rognage, le tracé déborde de la fenêtre et la vignette montre
      // des bords que le vrai pochoir n'a pas.
      var idClip = 'bande-' + f.setId + '-' + f.id;
      return html`
        <svg viewBox=${vb} aria-hidden="true">
          <defs>
            <clipPath id=${idClip}>
              <rect x=${b.x} y=${b.y} width=${b.w} height=${b.h}/>
            </clipPath>
          </defs>
          <g transform=${tourne}>
            <g clip-path=${'url(#' + idClip + ')'}>
              <path d=${fenetre + f.morceaux.map(function (m2) { return m2.d; }).join(' ')}
                    fill="currentColor" fill-rule="evenodd"/>
            </g>
          </g>
        </svg>`;
    }
    return html`
      <svg viewBox=${vb} aria-hidden="true">
        <g transform=${tourne}>
          ${f.morceaux.map(function (m2, i) {
            return html`<path key=${i} d=${m2.d} fill="currentColor"
              transform=${m2.dx || m2.dy || m2.rot
                ? 'translate(' + m2.dx + ',' + m2.dy + ') ' +
                  (m2.rot ? 'rotate(' + (m2.rot * 180 / Math.PI) + ' ' + m2.pcx + ' ' + m2.pcy + ')' : '')
                : null}/>`;
          })}
        </g>
      </svg>`;
  }

  /* -------------------------------------------------------- écran 1 */

  function Accueil(p) {
    return html`
      <div class="accueil">
        ${/* Le logo complet — pinceau, étoiles et fond jaune — et non le seul
              lettrage violet : c'est la première image de la marque qu'on
              donne, autant la donner entière. */''}
        <img class="logo" src="images/marque/logo-principal.png"
             width="800" height="321" alt="La Baguette Maquille"/>
        <h1>${TEXTES.titre}</h1>
        <p>${TEXTES.accroche}<br/>${TEXTES.accrocheSuite}</p>
        <button class="btn btn-rose" onClick=${p.onDemarrer}>${TEXTES.boutonDemarrer}</button>
        <p class="credit">${TEXTES.credit}</p>
      </div>`;
  }

  /* -------------------------------------------------------- galerie */

  /* Reproduit en CSS le cadrage que la toile fait au pinceau : la vignette de
     la galerie doit montrer exactement ce que l'atelier montrera.

     Une position en pourcentage aligne le même pourcentage de l'image sur
     celui de la pastille, ce qui donne pile `cadre.x / (taille - cadre)`. La
     formule reste juste quand le cadre déborde du fichier — les deux termes
     changent de signe ensemble ; seule l'égalité parfaite est à écarter, elle
     diviserait par zéro.

     La toile vierge n'a pas de fichier, mais elle passe par la MÊME formule :
     son « image » est un aplat de la teinte choisie, aux dimensions que
     `taille` lui donne. Elle se cadre donc comme les visages, et se retrouve
     exactement aussi large qu'eux, avec les mêmes marges blanches sur les
     côtés. Un cas particulier ici la ferait mentir sur ce que l'atelier
     montrera. */
  function cadrageFond(v, peauHex) {
    var zx = v.taille.w / v.cadre.w * 100;
    var zy = v.taille.h / v.cadre.h * 100;
    var px = v.cadre.w === v.taille.w ? 50 : v.cadre.x / (v.taille.w - v.cadre.w) * 100;
    var py = v.cadre.h === v.taille.h ? 50 : v.cadre.y / (v.taille.h - v.cadre.h) * 100;
    return {
      /* La pastille prend les proportions du cadre. Sans ça, elle resterait
         en portrait et rognerait un visage cadré plus large que haut. */
      aspectRatio: v.cadre.w + ' / ' + v.cadre.h,
      /* Un aplat n'a pas de proportions propres : il faut lui donner ses deux
         dimensions, là où une photo se contente de sa largeur. */
      backgroundImage: v.peau
        ? 'linear-gradient(' + peauHex + ', ' + peauHex + ')'
        : 'url("' + v.image + '")',
      backgroundSize: v.peau ? zx + '% ' + zy + '%' : zx + '% auto',
      backgroundPosition: px + '% ' + py + '%',
      backgroundRepeat: 'no-repeat'
    };
  }

  /* Carte d'un visage : l'image le choisit, le prénom se rebaptise.

     Le prénom est un bouton VOISIN de celui de l'image, et non dedans : un
     bouton dans un bouton n'existe pas en HTML, et le navigateur défait
     l'imbrication en silence. La carte est donc une simple boîte. */
  function CarteVisage(p) {
    var v = p.visage;
    var e1 = useState(false), edite = e1[0], setEdite = e1[1];
    var e2 = useState(''), texte = e2[0], setTexte = e2[1];
    var champ = useRef(null);
    var affiche = Modele.nom(p.noms, v);

    /* Le prénom en place est présélectionné : taper le remplace d'un coup,
       ce qui est le geste attendu quand on vient mettre celui de son enfant. */
    useEffect(function () {
      if (edite && champ.current) champ.current.select();
    }, [edite]);

    function ouvrir() { setTexte(affiche); setEdite(true); }
    function garder() { p.onRenommer(v.id, texte); setEdite(false); }

    return html`
      <div class="carte-visage">
        <button class="choix" title=${'Maquiller ' + affiche}
                onClick=${function () { p.onChoisir(v.id); }}>
          <span class="vignette" style=${cadrageFond(v)}></span>
        </button>

        ${edite
          ? html`
            <form class="pied renomme"
                  onSubmit=${function (ev) { ev.preventDefault(); garder(); }}>
              <input ref=${champ} type="text" value=${texte}
                     maxLength=${Modele.LIMITE_NOM}
                     placeholder=${v.nom}
                     aria-label=${'Prénom à la place de ' + v.nom}
                     onChange=${function (ev) { setTexte(ev.target.value); }}
                     onBlur=${garder}
                     onKeyDown=${function (ev) {
                       if (ev.key === 'Escape') { ev.preventDefault(); setEdite(false); }
                     }}/>
              <button type="submit" class="ok" title="Garder ce prénom">
                <${Icone} nom="valider"/>
              </button>
            </form>`
          : html`
            <button class="pied" title=${'Remplacer « ' + affiche +' » par un autre prénom'}
                    onClick=${ouvrir}>
              <span class="prenom">${affiche}</span>
              <${Icone} nom="crayon"/>
            </button>`}
      </div>`;
  }

  function peauHex(id) {
    for (var i = 0; i < PEAUX.length; i++) if (PEAUX[i].id === id) return PEAUX[i].hex;
    return PEAUX[0].hex;
  }

  /* Le prénom dans le bandeau de l'atelier, rebaptisable là aussi.

     Même geste que sur la carte de la galerie — on touche le prénom, on tape
     le sien — mais en tout petit, dans un bandeau qui n'a que 34 pixels de
     haut : le crayon ne se montre qu'au survol, et le champ prend la place du
     texte sans rien pousser.

     La toile vierge n'est le visage de personne : elle garde son nom. */
  function TitreAtelier(p) {
    var v = p.visage;
    var e1 = useState(false), edite = e1[0], setEdite = e1[1];
    var e2 = useState(''), texte = e2[0], setTexte = e2[1];
    var champ = useRef(null);
    var affiche = Modele.nom(p.noms, v);

    useEffect(function () {
      if (edite && champ.current) champ.current.select();
    }, [edite]);

    if (v.peau) return html`<span class="titre-mini">${affiche}</span>`;

    function ouvrir() { setTexte(affiche); setEdite(true); }
    function garder() { p.onRenommer(v.id, texte); setEdite(false); }

    if (edite) {
      return html`
        <form class="titre-renomme"
              onSubmit=${function (ev) { ev.preventDefault(); garder(); }}>
          <input ref=${champ} type="text" value=${texte}
                 maxLength=${Modele.LIMITE_NOM}
                 placeholder=${v.nom}
                 aria-label=${'Prénom à la place de ' + v.nom}
                 onChange=${function (ev) { setTexte(ev.target.value); }}
                 onBlur=${garder}
                 onKeyDown=${function (ev) {
                   if (ev.key === 'Escape') { ev.preventDefault(); setEdite(false); }
                 }}/>
          <button type="submit" class="ok" title="Garder ce prénom">
            <${Icone} nom="valider"/>
          </button>
        </form>`;
    }

    return html`
      <button class="titre-mini modifiable"
              title=${'Remplacer « ' + affiche + ' » par un autre prénom'}
              onClick=${ouvrir}>
        <span>${affiche}</span>
        <${Icone} nom="crayon"/>
      </button>`;
  }

  /* La carte de la toile vierge. Elle ne se rebaptise pas — ce n'est le visage
     de personne : sous la vignette, on choisit la teinte du fond au lieu d'un
     prénom. Le choix se voit aussitôt sur la vignette, et il vaut ensuite pour
     l'atelier, pour la fiche et pour l'image à partager.

     Les pastilles sont dans la carte plutôt que dans la barre d'outils : à
     côté des couleurs de fard, elles feraient croire à des fards de plus. */
  function CartePeau(p) {
    var v = p.visage;
    return html`
      <div class="carte-visage carte-peau">
        ${/* Le nom seul suffit à nommer le bouton : « Maquiller Toile vierge »
              ne se dirait pas, là où « Maquiller Lou » va de soi. */''}
        <button class="choix" aria-label=${v.nom}
                onClick=${function () { p.onChoisir(v.id); }}>
          <span class="vignette" style=${cadrageFond(v, peauHex(p.peauId))}>
            <span class="etiquette-peau">
              <span class="nom-peau">${v.nom}</span>
              ${v.sous ? html`<span class="sous-peau">${v.sous}</span>` : null}
            </span>
          </span>
        </button>

        <div class="pied peaux" role="group" aria-label="Teinte de la toile vierge">
          ${PEAUX.map(function (t) {
            return html`
              <button key=${t.id}
                      class=${'teinte' + (t.id === p.peauId ? ' actif' : '')}
                      style=${{ background: t.hex }}
                      title=${t.nom} aria-label=${t.nom}
                      aria-pressed=${t.id === p.peauId}
                      onClick=${function () { p.onPeau(t.id); }}></button>`;
          })}
        </div>
      </div>`;
  }

  function Galerie(p) {
    return html`
      <div class="galerie">
        <h2>${TEXTES.titreGalerie}</h2>
        <div class="grille-visages">
          ${VISAGES.map(function (v) {
            if (v.peau) {
              return html`
                <${CartePeau} key=${v.id} visage=${v} peauId=${p.peauId}
                              onPeau=${p.onPeau} onChoisir=${p.onChoisir}/>`;
            }
            return html`
              <${CarteVisage} key=${v.id} visage=${v} noms=${p.noms}
                              onChoisir=${p.onChoisir} onRenommer=${p.onRenommer}/>`;
          })}
        </div>
        ${/* On ne promet pas de date : juste que la galerie n'est pas close. */''}
        <p class="a-venir">Plus de visages à venir !</p>
      </div>`;
  }

  /* -------------------------------------------------- barre d'outils */

  var OUTILS = [
    { id: 'pochoir',  nom: 'Pochoirs', icone: 'pochoir' },
    { id: 'pinceau',  nom: 'Pinceau',  icone: 'pinceau' },
    { id: 'gomme',    nom: 'Gomme',    icone: 'gomme' },
    { id: 'modifier', nom: 'Modifier', icone: 'modifier' }
  ];

  /* La pastille d'un fard nacré porte la tuile de paillettes du dessin, et non
     une imitation : ce qu'on choisit est ce qu'on obtient. Elle est montrée un
     peu grossie, sans quoi le grain serait indiscernable sur 40 pixels. */
  var GROSSISSEMENT_PASTILLE = 2.2;

  function stylePastille(c) {
    if (!c.nacre) return { background: c.hex };
    var cote = Rendu.coteTuileMm() * 3 * GROSSISSEMENT_PASTILLE;
    return {
      backgroundColor: c.hex,
      backgroundImage: 'url("' + Rendu.tuileEnImage(c.hex) + '")',
      backgroundSize: cote.toFixed(1) + 'px',
      backgroundRepeat: 'repeat'
    };
  }

  function Pastille(p) {
    var c = p.couleur;
    return html`
      <button title=${c.nom + (c.nacre ? ' (nacré)' : '')} aria-label=${c.nom}
        class=${'pastille' + (c.id === p.couleurId ? ' actif' : '') + (c.nacre ? ' nacre' : '')}
        style=${stylePastille(c)}
        onClick=${function () { p.onCouleur(c.id); }}></button>`;
  }

  function Palette(p) {
    var groupes = [
      { titre: 'Mates',   couleurs: COULEURS.filter(function (c) { return !c.nacre; }) },
      { titre: 'Nacrées', couleurs: COULEURS.filter(function (c) { return c.nacre; }) }
    ].filter(function (g) { return g.couleurs.length; });

    return html`
      <div class="palette">
        ${/* Le mot « Couleur » n'apprend rien devant des pastilles de couleur :
             on ne l'affiche que lorsqu'il précise sur quoi elles agissent. */
          p.surSelection
            ? html`<p class="tiroir-titre">Couleur de la forme choisie</p>`
            : null}
        <div class="rangs">
          ${groupes.map(function (g) {
            return html`
              <div class="groupe-apart" key=${g.titre}>
                <span class="etiquette-groupe">${g.titre}</span>
                <div class="groupe">
                  ${g.couleurs.map(function (c) {
                    return html`<${Pastille} key=${c.id} couleur=${c}
                                  couleurId=${p.couleurId} onCouleur=${p.onCouleur}/>`;
                  })}
                </div>
              </div>`;
          })}
        </div>
      </div>`;
  }

  /* Réglage de taille, avec un aperçu du diamètre réel juste en dessous.
     La place réservée correspond au diamètre MAXIMAL de l'outil : l'aperçu
     n'est ainsi jamais à l'étroit, et la mise en page ne sursaute pas quand
     on fait glisser le curseur. */
  /* `echelle` est le nombre de pixels d'écran que vaut un millimètre de peau,
     GROSSISSEMENT COMPRIS. C'est ce qui rend l'aperçu honnête : quand on
     s'approche du visage, le rond du pinceau grossit à l'écran, et celui de
     l'aperçu grossit avec lui. Sans ça, l'aperçu annonçait une taille qui
     n'était plus celle qu'on posait. */
  function Curseur(p) {
    var diametre = Math.max(3, p.valeur * p.echelle);
    var place = parseFloat(p.max) * p.echelle;
    return html`
      <div class="reglage-bloc">
        <div class="reglage">
          <label>${p.libelle}</label>
          <input type="range" min=${p.min} max=${p.max} step="0.5" value=${p.valeur}
                 onInput=${function (e) { p.onChange(parseFloat(e.target.value)); }}/>
        </div>
        <div class="apercu-taille" style=${{ height: (place + 10) + 'px' }}>
          <span class=${p.creux ? 'creux' : ''} style=${{
            width: diametre + 'px', height: diametre + 'px',
            background: p.creux ? 'transparent' : p.couleur
          }}></span>
        </div>
      </div>`;
  }

  function Tiroir(p) {
    if (p.outil === 'pochoir') {
      return html`
        <div class="tiroir">
          ${Formes.sets().map(function (set) {
            return html`
              <div key=${set.id}>
                <div class="set-titre">${set.nom}</div>
                <div class="grille-formes">
                  ${set.formes.map(function (f) {
                    var actif = p.formeChoisie && p.formeChoisie.cle === f.cle;
                    return html`
                      <button key=${f.cle} class=${'case-forme' + (actif ? ' actif' : '')}
                              onClick=${function () { p.onForme(f); }}>
                        <${VignetteForme} forme=${f}/>
                        <span class="nom">${f.nom}</span>
                      </button>`;
                  })}
                </div>
              </div>`;
          })}
        </div>`;
    }

    if (p.outil === 'pinceau') {
      return html`
        <div class="tiroir">
          <${Curseur} libelle="Taille du pinceau" min="1" max="20" valeur=${p.taillePinceau}
                      echelle=${p.echelle} couleur=${p.couleurHex} onChange=${p.onTaillePinceau}/>
        </div>`;
    }

    if (p.outil === 'gomme') {
      return html`
        <div class="tiroir">
          <${Curseur} libelle="Taille de la gomme" min="2" max="30" valeur=${p.tailleGomme}
                      echelle=${p.echelle} creux=${true} onChange=${p.onTailleGomme}/>
        </div>`;
    }

    /* Gomme et Modifier n'ont plus de mode d'emploi écrit. Ces deux outils se
       comprennent en les touchant, et le pavé de texte encombrait la colonne
       pour ne dire que l'évident. Retiré le 06/09/2026. */
    return html`<div class="tiroir"></div>`;
  }

  function BarreOutils(p) {
    return html`
      <div class="outils">
        <div class="rangee-outils">
          ${OUTILS.map(function (o) {
            return html`
              <button key=${o.id} class=${'outil' + (o.id === p.outil ? ' actif' : '')}
                      onClick=${function () { p.onOutil(o.id); }}>
                <${Icone} nom=${o.icone}/>
                <span>${o.nom}</span>
              </button>`;
          })}
          <button class="outil outil-danger" disabled=${!p.aDuTravail} onClick=${p.onToutEffacer}>
            <${Icone} nom="poubelle"/>
            <span>Tout effacer</span>
          </button>
        </div>
        ${/* Retirer et retourner ont quitté la forme pour venir ici : sur un
              téléphone, on visait ces pastilles à côté et on tamponnait un
              motif de plus. La bande reste visible quel que soit l'outil,
              parce qu'on vient de poser un pochoir et qu'il est déjà choisi. */''}
        ${p.selection ? html`
          <div class="boutons-forme">
            <button class="btn btn-secondaire btn-petit" onClick=${p.onMiroir}>
              <${Icone} nom="miroir"/> Retourner
            </button>
            <button class="btn btn-fantome btn-petit" onClick=${p.onSupprimer}>
              <${Icone} nom="poubelle"/> Retirer
            </button>
          </div>` : null}
        <${Tiroir} ...${p}/>
        <${Palette} couleurId=${p.couleurId} onCouleur=${p.onCouleur}
                    surSelection=${!!p.selection}/>
      </div>`;
  }

  /* ------------------------------------------------------ dialogues */

  /* `etroite` resserre la boîte pour les questions courtes : une phrase de deux
     lignes dans une boîte prévue pour la liste du matériel s'étale, et le
     dernier mot se retrouve seul en début de ligne. */
  function Dialogue(p) {
    return html`
      <div class="voile" onClick=${p.onFermer}>
        <div class=${'boite' + (p.etroite ? ' etroite' : '')}
             onClick=${function (e) { e.stopPropagation(); }}>
          ${/* Une croix vaut mieux qu'un bouton « Plus tard » aligné avec les
                autres : elle dit « fermer » sans se disputer la place avec ce
                qu'on est venu faire, et libère la ligne du bas. */''}
          ${p.onFermer && p.croix
            ? html`
              <button class="croix" title="Fermer" aria-label="Fermer"
                      onClick=${p.onFermer}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18"></path>
                </svg>
              </button>`
            : null}
          <h3>${p.titre}</h3>
          <p>${p.texte}</p>
          ${p.enfants}
          <div class=${'actions' + (p.croix ? ' centrees' : '')}>${p.actions}</div>
        </div>
      </div>`;
  }

  /* Une colonne du récapitulatif : des groupes titrés, chacun suivi de ce
     qu'il contient. Le titre porte le lien vers le kit ou la planche — c'est
     lui qu'on va acheter, pas la couleur prise à part. */
  function BlocRecap(p) {
    return html`
      <div class="recap-bloc">
        <p class="tiroir-titre">${p.titre}</p>
        ${p.groupes.map(function (g) {
          return html`
            <div class="recap-groupe" key=${g.titre}>
              ${g.lien
                ? html`<a class="ou" href=${g.lien} target="_blank" rel="noopener">${g.titre}</a>`
                : html`<span class="ou">${g.titre}</span>`}
              <ul>${g.articles.map(p.ligne)}</ul>
            </div>`;
        })}
      </div>`;
  }

  /* Le récapitulatif du matériel, montré à l'écran avant le téléchargement.
     Il est rangé comme la fiche imprimée, et pour la même raison : ce qu'on
     achète ensemble se lit ensemble. */
  function Recap(p) {
    var inv = p.inventaire;
    if (!inv.parKit.length && !inv.parPlanche.length) {
      return html`<p class="recap-vide">Tu n'as encore rien posé sur le visage.</p>`;
    }
    return html`
      <div class="recap">
        ${inv.parKit.length ? html`
          <${BlocRecap} titre="Les couleurs" groupes=${inv.parKit}
            ligne=${function (c) {
              return html`
                <li key=${c.id}>
                  <span class="puce" style=${{ background: c.hex }}></span>
                  <span>${c.nom}</span>
                </li>`;
            }}/>` : null}

        ${inv.parPlanche.length ? html`
          <${BlocRecap} titre="Les pochoirs" groupes=${inv.parPlanche}
            ligne=${function (f) {
              return html`
                <li key=${f.cle}>
                  <span class="puce-forme"><${VignetteForme} forme=${f}/></span>
                  <span>${f.nom}</span>
                </li>`;
            }}/>` : null}
      </div>`;
  }

  return {
    /* Partagé avec la toile, pour que le dessin et l'explication ne puissent
       pas dire deux choses différentes. */
    avecPoignees: function () { return AVEC_POIGNEES; },
    Icone: Icone, VignetteForme: VignetteForme, Accueil: Accueil,
    Galerie: Galerie, BarreOutils: BarreOutils, Dialogue: Dialogue,
    Palette: Palette, Recap: Recap, TitreAtelier: TitreAtelier
  };
})();
