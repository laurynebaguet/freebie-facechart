/* État du dessin, historique annuler/rétablir, et sauvegarde locale.

   Toutes les coordonnées sont en MILLIMÈTRES RÉELS, origine au coin haut
   gauche du cadre du visage. Elles ne dépendent donc ni de la taille de
   l'écran ni de la résolution de l'image.

   Un dessin est une liste ordonnée d'éléments :

     { type: 'forme', setId, formeId, couleurId, x, y, rot, miroir, gommes }
     { type: 'trait', couleurId, taille, points, gommes }

   Les coups de gomme sont rangés DANS l'élément qu'ils entament, et exprimés
   dans le repère propre de cet élément. C'est ce qui fait qu'une forme
   entamée garde sa morsure quand on la déplace ou qu'on la fait pivoter. */
var Modele = (function () {
  'use strict';

  /* ------------------------------------------------------------- dessin */

  function vide() { return { elements: [], seq: 1 }; }

  function ajouter(dessin, element) {
    var el = Object.assign({}, element, { id: dessin.seq });
    return { elements: dessin.elements.concat([el]), seq: dessin.seq + 1 };
  }

  function modifier(dessin, id, patch) {
    return {
      elements: dessin.elements.map(function (e) {
        return e.id === id ? Object.assign({}, e, patch) : e;
      }),
      seq: dessin.seq
    };
  }

  function supprimer(dessin, id) {
    return {
      elements: dessin.elements.filter(function (e) { return e.id !== id; }),
      seq: dessin.seq
    };
  }

  function trouver(dessin, id) {
    for (var i = 0; i < dessin.elements.length; i++) {
      if (dessin.elements[i].id === id) return dessin.elements[i];
    }
    return null;
  }

  /* Ajoute un coup de gomme à chaque élément concerné. `pourElement` reçoit
     l'élément et renvoie la trace à ranger dedans, ou rien s'il est épargné. */
  function gommer(dessin, pourElement) {
    var touche = false;
    var elements = dessin.elements.map(function (el) {
      var trace = pourElement(el);
      if (!trace) return el;
      touche = true;
      return Object.assign({}, el, { gommes: (el.gommes || []).concat([trace]) });
    });
    return touche ? { elements: elements, seq: dessin.seq } : dessin;
  }

  /* --------------------------------------------------------- historique */
  /* Les éléments ne sont jamais mutés, donc un instantané ne coûte qu'un
     tableau de références : on peut en garder beaucoup sans alourdir. */

  var MAX = 80;

  function histoNeuf(dessin) {
    return { passe: [], present: dessin || vide(), futur: [] };
  }

  function histoAppliquer(h, dessin) {
    if (dessin === h.present) return h;
    var passe = h.passe.concat([h.present]);
    if (passe.length > MAX) passe = passe.slice(passe.length - MAX);
    return { passe: passe, present: dessin, futur: [] };
  }

  function peutAnnuler(h) { return h.passe.length > 0; }
  function peutRefaire(h) { return h.futur.length > 0; }

  function annuler(h) {
    if (!peutAnnuler(h)) return h;
    return {
      passe: h.passe.slice(0, -1),
      present: h.passe[h.passe.length - 1],
      futur: [h.present].concat(h.futur)
    };
  }

  function refaire(h) {
    if (!peutRefaire(h)) return h;
    return {
      passe: h.passe.concat([h.present]),
      present: h.futur[0],
      futur: h.futur.slice(1)
    };
  }

  /* ---------------------------------------------------------- sauvegarde */

  var CLE = 'lbm-freebie-v2';
  var minuteur = null;

  function charger() {
    try {
      var brut = window.localStorage.getItem(CLE);
      if (!brut) return null;
      var o = JSON.parse(brut);
      return (o && o.version === 2 && o.dessin) ? o : null;
    } catch (e) { return null; }
  }

  function enregistrer(etat) {
    if (minuteur) clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      try {
        window.localStorage.setItem(CLE, JSON.stringify({
          version: 2,
          visageId: etat.visageId,
          telecharge: etat.telecharge,
          dessin: etat.dessin
        }));
      } catch (e) { /* quota plein ou navigation privée : on continue sans */ }
    }, 400);
  }

  function oublier() {
    try { window.localStorage.removeItem(CLE); } catch (e) {}
  }

  return {
    vide: vide, ajouter: ajouter, modifier: modifier, supprimer: supprimer,
    trouver: trouver, gommer: gommer,
    histoNeuf: histoNeuf, histoAppliquer: histoAppliquer,
    annuler: annuler, refaire: refaire,
    peutAnnuler: peutAnnuler, peutRefaire: peutRefaire,
    charger: charger, enregistrer: enregistrer, oublier: oublier
  };
})();
