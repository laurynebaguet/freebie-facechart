/* Tous les morceaux visibles de l'interface, hors toile de dessin. */
var UI = (function () {
  'use strict';
  var html = htm.bind(React.createElement);

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
    visages:  ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0']
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
    // carré centré sur le motif redressé ; les dimensions tiennent déjà compte
    // de la rotation de présentation
    var demi = Math.max(f.largeurMm, f.hauteurMm) / 2 * 1.08;
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
        <img class="logo" src="images/marque/logo-violet.svg" alt="La Baguette Maquille"/>
        <h1>${TEXTES.titre}</h1>
        <p>${TEXTES.accroche}</p>
        <button class="btn btn-primaire" onClick=${p.onDemarrer}>${TEXTES.boutonDemarrer}</button>
      </div>`;
  }

  /* -------------------------------------------------------- galerie */

  function cadrageFond(v) {
    var zx = v.taille.w / v.cadre.w * 100;
    var px = v.cadre.w >= v.taille.w ? 50 : v.cadre.x / (v.taille.w - v.cadre.w) * 100;
    var py = v.cadre.h >= v.taille.h ? 50 : v.cadre.y / (v.taille.h - v.cadre.h) * 100;
    return {
      backgroundImage: 'url("' + v.image + '")',
      backgroundSize: zx + '% auto',
      backgroundPosition: px + '% ' + py + '%',
      backgroundRepeat: 'no-repeat'
    };
  }

  function Galerie(p) {
    return html`
      <div class="galerie">
        <h2>${p.enCours ? 'Changer de visage' : 'Choisis un visage'}</h2>
        <p class="sous">
          ${p.enCours
            ? 'Ton maquillage te suit : tu peux voir le même sur un autre enfant.'
            : 'Tu pourras en changer à tout moment sans rien perdre.'}
        </p>
        <div class="grille-visages">
          ${VISAGES.map(function (v) {
            return html`
              <button key=${v.id} class="carte-visage"
                      onClick=${function () { p.onChoisir(v.id); }}>
                <span class="vignette" style=${cadrageFond(v)}></span>
                <span class="pied">${v.nom}</span>
              </button>`;
          })}
        </div>
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
        <p class="tiroir-titre">Couleur${p.surSelection ? ' de la forme choisie' : ''}</p>
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
          <p class="aide">
            Efface le maquillage sans toucher au visage. Pratique pour retirer
            seulement quelques bulles.
          </p>
          <${Curseur} libelle="Taille de la gomme" min="2" max="30" valeur=${p.tailleGomme}
                      echelle=${p.echelle} creux=${true} onChange=${p.onTailleGomme}/>
        </div>`;
    }

    var sel = p.selection;
    return html`
      <div class="tiroir">
        ${sel
          ? html`
            <p class="aide" style=${{ marginBottom: 0 }}>
              Fais glisser la forme pour la placer. Autour d'elle : le rond du
              haut la fait pivoter, la pastille du coin bas droit l'agrandit ou
              la réduit, celle du bas la retourne en miroir, la rose la retire.
            </p>`
          : html`
            <p class="aide">
              Touche une forme déjà posée pour la déplacer, la faire tourner,
              la retourner ou changer sa couleur.
            </p>`}
      </div>`;
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
        <${Tiroir} ...${p}/>
        <${Palette} couleurId=${p.couleurId} onCouleur=${p.onCouleur}
                    surSelection=${!!p.selection}/>
      </div>`;
  }

  /* ------------------------------------------------------ dialogues */

  function Dialogue(p) {
    return html`
      <div class="voile" onClick=${p.onFermer}>
        <div class="boite" onClick=${function (e) { e.stopPropagation(); }}>
          <h3>${p.titre}</h3>
          <p>${p.texte}</p>
          ${p.enfants}
          <div class="actions">${p.actions}</div>
        </div>
      </div>`;
  }

  function kitsDe(couleur) {
    return (couleur.kits || []).map(function (k) {
      for (var i = 0; i < KITS.length; i++) if (KITS[i].id === k) return KITS[i];
      return null;
    }).filter(Boolean);
  }

  /* Le récapitulatif du matériel, montré à l'écran avant le téléchargement. */
  function Recap(p) {
    if (!p.inventaire.couleurs.length && !p.inventaire.formes.length) {
      return html`<p class="recap-vide">Tu n'as encore rien posé sur le visage.</p>`;
    }
    return html`
      <div class="recap">
        ${p.inventaire.couleurs.length ? html`
          <div class="recap-bloc">
            <p class="tiroir-titre">Les couleurs</p>
            <ul>
              ${p.inventaire.couleurs.map(function (c) {
                var kits = kitsDe(c);
                return html`
                  <li key=${c.id}>
                    <span class="puce" style=${{ background: c.hex }}></span>
                    <span>
                      ${c.nom}
                      ${kits.length ? html`
                        <a class="ou" href=${kits[0].lien} target="_blank" rel="noopener">
                          ${'dans ' + kits.map(function (k) { return k.nom; }).join(', ')}
                        </a>` : null}
                    </span>
                  </li>`;
              })}
            </ul>
          </div>` : null}

        ${p.inventaire.formes.length ? html`
          <div class="recap-bloc">
            <p class="tiroir-titre">Les pochoirs</p>
            <ul>
              ${p.inventaire.formes.map(function (f) {
                return html`
                  <li key=${f.cle}>
                    <span class="puce-forme"><${VignetteForme} forme=${f}/></span>
                    <span>
                      ${f.nom}
                      <a class="ou" href=${f.setLien} target="_blank" rel="noopener">${f.setNom}</a>
                    </span>
                  </li>`;
              })}
            </ul>
          </div>` : null}
      </div>`;
  }

  return {
    Icone: Icone, VignetteForme: VignetteForme, Accueil: Accueil,
    Galerie: Galerie, BarreOutils: BarreOutils, Dialogue: Dialogue,
    Palette: Palette, Recap: Recap
  };
})();
