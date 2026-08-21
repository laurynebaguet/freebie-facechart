/* Dessin de la scène sur une toile (canvas).

   Deux couches superposées :
     - le facechart, jamais modifié ;
     - le maquillage, dessiné à part pour que rien n'attaque le visage.

   Chaque élément entamé par la gomme est rendu sur une toile tampon, où l'on
   creuse ses morsures dans SON repère, avant de le composer sur la couche.
   C'est ce qui fait qu'une forme mordue garde sa morsure quand elle bouge. */
var Rendu = (function () {
  'use strict';

  /* Repère d'un visage : combien de millimètres réels fait son cadre. */
  function repere(visage) {
    var mmParPxImage = LARGEUR_VISAGE_MM / (visage.visage.droite - visage.visage.gauche);
    return {
      visage: visage,
      largeurMm: visage.cadre.w * mmParPxImage,
      hauteurMm: visage.cadre.h * mmParPxImage
    };
  }

  function fond(ctx, image, rep, largeurPx) {
    var c = rep.visage.cadre;
    var e = largeurPx / rep.largeurMm;
    ctx.drawImage(image, c.x, c.y, c.w, c.h, 0, 0, largeurPx, rep.hauteurMm * e);
  }

  /* ------------------------------------------------------------ nacre */

  function couleurPar(id) {
    for (var i = 0; i < COULEURS.length; i++) if (COULEURS[i].id === id) return COULEURS[i];
    return null;
  }

  /* Éclaircit (f > 0) ou assombrit (f < 0) une teinte. */
  function nuance(hex, f) {
    var r = parseInt(hex.slice(1, 3), 16);
    var v = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    function m(c) {
      var x = f >= 0 ? c + (255 - c) * f : c * (1 + f);
      return Math.max(0, Math.min(255, Math.round(x)));
    }
    return 'rgb(' + m(r) + ',' + m(v) + ',' + m(b) + ')';
  }

  /* Un fard nacré est une poudre : ce ne sont pas des reflets métalliques en
     bandes, mais une multitude de points minuscules qui accrochent la lumière.
     On fabrique donc une tuile semée de micro-paillettes, qu'on répète sur la
     surface. Le semis est tiré d'une suite pseudo-aléatoire à graine fixe :
     il doit être identique d'une image à l'autre, sinon la texture grouille. */

  /* Finesse du grain, réglée à l'œil par Lauryne : les paillettes de ses fards
     sont très fines. Un point de la tuile vaut 0,04 mm, donc la tuile entière
     couvre à peine 5 mm de peau. */
  var MM_PAR_PIXEL = 0.04;
  var tuiles = {};

  function tuileNacre(hex) {
    if (tuiles[hex]) return tuiles[hex];
    var N = 128;
    var t = document.createElement('canvas');
    t.width = N; t.height = N;
    var c = t.getContext('2d');
    c.fillStyle = hex;
    c.fillRect(0, 0, N, N);

    var graine = 987654321;
    function alea() {
      graine = (graine * 1103515245 + 12345) & 0x7fffffff;
      return graine / 0x7fffffff;
    }
    for (var i = 0; i < 340; i++) {
      var x = alea() * N, y = alea() * N, r = 0.45 + alea() * 1.25;
      var brille = alea();
      c.fillStyle = brille > 0.38
        ? 'rgba(255,255,255,' + (0.30 + alea() * 0.5).toFixed(3) + ')'
        : 'rgba(0,0,0,' + (0.10 + alea() * 0.16).toFixed(3) + ')';
      // chaque grain est répété sur les huit voisins : la tuile se raccorde
      // ainsi sans couture visible
      for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
          c.beginPath();
          c.arc(x + dx * N, y + dy * N, r, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    tuiles[hex] = t;
    return t;
  }

  /* `unite` : combien de pixels du repère courant valent un millimètre.
     1 dans le repère d'un motif (déjà en mm), l'échelle pour un trait. */
  function remplissage(ctx, id, unite, couleurDe) {
    var c = couleurPar(id);
    var hex = c ? c.hex : couleurDe(id);
    if (!c || !c.nacre) return hex;
    var motif = ctx.createPattern(tuileNacre(hex), 'repeat');
    if (motif.setTransform) {
      motif.setTransform(new DOMMatrix().scale(MM_PAR_PIXEL * unite));
    }
    return motif;
  }

  /* --------------------------------------------------------- géométrie */

  /* Place le contexte dans le repère local d'une forme posée. Après cet
     appel, une unité vaut un millimètre de la planche de pochoirs.

     La rotation de présentation vient en DERNIER, donc au plus près du tracé :
     elle redresse le motif sans entraîner ni le cadre de sélection ni le
     miroir, qui restent dans le repère de l'utilisateur. */
  function transformeForme(ctx, el, forme, echelle) {
    var k = el.zoom || 1;
    ctx.translate(el.x * echelle, el.y * echelle);
    ctx.rotate(el.rot || 0);
    if (el.miroir) ctx.scale(-1, 1);
    ctx.scale(echelle * k, echelle * k);
    ctx.translate(-forme.cx, -forme.cy);
    if (forme.rotBase) {
      ctx.translate(forme.pivot.x, forme.pivot.y);
      ctx.rotate(forme.rotBase);
      ctx.translate(-forme.pivot.x, -forme.pivot.y);
    }
  }

  /* Dimensions d'une forme posée, agrandissement compris, en mm. */
  function dimensions(el, forme) {
    var k = el.zoom || 1;
    return { l: forme.largeurMm * k, h: forme.hauteurMm * k };
  }

  /* Un point du visage (mm) vers le repère propre d'un élément : l'inverse
     exact de la transformation ci-dessus. */
  function versLocal(el, forme, xMm, yMm) {
    if (el.type !== 'forme') return { x: xMm, y: yMm };
    var a = -(el.rot || 0);
    var k = el.zoom || 1;
    var dx = xMm - el.x, dy = yMm - el.y;
    var lx = dx * Math.cos(a) - dy * Math.sin(a);
    var ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (el.miroir) lx = -lx;
    lx = lx / k + forme.cx;
    ly = ly / k + forme.cy;
    if (forme.rotBase) {
      var b = -forme.rotBase;
      var px = lx - forme.pivot.x, py = ly - forme.pivot.y;
      lx = forme.pivot.x + px * Math.cos(b) - py * Math.sin(b);
      ly = forme.pivot.y + px * Math.sin(b) + py * Math.cos(b);
    }
    return { x: lx, y: ly };
  }

  /* Demi-diagonale : rayon qui contient sûrement l'élément. */
  function rayon(el, forme) {
    if (el.type === 'forme') {
      return Math.hypot(forme.largeurMm, forme.hauteurMm) / 2;
    }
    return 0;
  }

  /* ------------------------------------------------------------ tracés */

  function trace(ctx, points, taille, echelle) {
    if (!points.length) return;
    ctx.lineWidth = Math.max(0.1, taille * echelle);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0] * echelle, points[0][1] * echelle);
    if (points.length === 1) {
      ctx.lineTo(points[0][0] * echelle + 0.01, points[0][1] * echelle);
    } else {
      // lissage : on relie les milieux de segments par des quadratiques
      for (var i = 1; i < points.length - 1; i++) {
        var mx = (points[i][0] + points[i + 1][0]) / 2;
        var my = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0] * echelle, points[i][1] * echelle,
                             mx * echelle, my * echelle);
      }
      var d = points[points.length - 1];
      ctx.lineTo(d[0] * echelle, d[1] * echelle);
    }
    ctx.stroke();
  }

  /* Dessine un élément sans tenir compte de ses morsures. */
  function corps(ctx, el, echelle, couleurDe) {
    ctx.save();
    if (el.type === 'forme') {
      var f = Formes.get(el.setId, el.formeId);
      if (f) {
        transformeForme(ctx, el, f, echelle);
        // ici le repère est déjà en millimètres : une unité vaut un millimètre
        ctx.fillStyle = remplissage(ctx, el.couleurId, 1, couleurDe);
        if (f.bande) {
          // la fenêtre borne le motif, et le tracé y creuse les manques
          ctx.beginPath();
          ctx.rect(f.bande.x, f.bande.y, f.bande.w, f.bande.h);
          ctx.clip();
          ctx.fill(f.path2d, 'evenodd');
        } else {
          ctx.fill(f.path2d);
        }
      }
    } else if (el.type === 'trait') {
      // le tracé travaille en pixels : un millimètre y vaut « echelle »
      ctx.strokeStyle = remplissage(ctx, el.couleurId, echelle, couleurDe);
      trace(ctx, el.points, el.taille, echelle);
    }
    ctx.restore();
  }

  /* Creuse les morsures de gomme d'un élément, dans son repère. */
  function morsures(ctx, el, echelle) {
    if (!el.gommes || !el.gommes.length) return;
    var f = el.type === 'forme' ? Formes.get(el.setId, el.formeId) : null;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    if (f) {
      transformeForme(ctx, el, f, echelle);
      // dans ce repère une unité vaut déjà un millimètre
      el.gommes.forEach(function (g) { trace(ctx, g.points, g.taille, 1); });
    } else {
      el.gommes.forEach(function (g) { trace(ctx, g.points, g.taille, echelle); });
    }
    ctx.restore();
  }

  /* Dessine tout le maquillage sur une toile transparente.
     `tampon` est une toile de travail de même taille, réutilisée. */
  function maquillage(ctx, dessin, echelle, couleurDe, apercu, tampon) {
    function un(el) {
      if (!el.gommes || !el.gommes.length || !tampon) {
        corps(ctx, el, echelle, couleurDe);
        morsures(ctx, el, echelle);
        return;
      }
      var tctx = tampon.getContext('2d');
      tctx.setTransform(ctx.getTransform());
      tctx.clearRect(0, 0, tampon.width, tampon.height);
      corps(tctx, el, echelle, couleurDe);
      morsures(tctx, el, echelle);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(tampon, 0, 0);
      ctx.restore();
    }
    dessin.elements.forEach(un);
    if (apercu) un(apercu);
  }

  /* --------------------------------------------------------- sélection */

  var MARGE_MM = 3;

  /* Où se trouvent les poignées d'une forme sélectionnée, en mm. */
  function poignees(el, forme, poigneeMm) {
    var d = dimensions(el, forme);
    var w = d.l / 2 + MARGE_MM;
    var h = d.h / 2 + MARGE_MM;
    var a = el.rot || 0;
    function place(lx, ly) {
      return {
        x: el.x + lx * Math.cos(a) - ly * Math.sin(a),
        y: el.y + lx * Math.sin(a) + ly * Math.cos(a)
      };
    }
    return {
      rotation: place(0, -h - poigneeMm),
      poubelle: place(w, -h),
      miroir: place(0, h + poigneeMm),
      redim: place(w, h),
      demi: { w: w, h: h, a: a }
    };
  }

  function selection(ctx, el, echelle, poigneeMm) {
    var f = Formes.get(el.setId, el.formeId);
    if (!f) return;
    var d = dimensions(el, f);
    var w = d.l * echelle, h = d.h * echelle;
    var m = MARGE_MM * echelle;
    var r = poigneeMm * echelle;

    var a = el.rot || 0;
    ctx.save();
    ctx.translate(el.x * echelle, el.y * echelle);
    ctx.rotate(a);

    ctx.strokeStyle = '#7B3FD3';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(-w / 2 - m, -h / 2 - m, w + 2 * m, h + 2 * m);
    ctx.setLineDash([]);

    // tige et bouton de rotation, au-dessus
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 - m);
    ctx.lineTo(0, -h / 2 - m - r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -h / 2 - m - r, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();

    /* Une pastille, avec son pictogramme redressé pour rester lisible même
       quand la forme est de travers. */
    function pastille(px, py, fond, dessine) {
      ctx.beginPath();
      ctx.arc(px, py, r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = fond;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-a);
      ctx.strokeStyle = '#fff';
      // trait fin : à cette taille, un trait épais empâte le pictogramme
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      dessine(r * 0.3);
      ctx.restore();
    }

    // suppression, au coin haut droit
    pastille(w / 2 + m, -h / 2 - m, '#D9487E', function (b) {
      ctx.beginPath();
      ctx.moveTo(-b, -b); ctx.lineTo(b, b);
      ctx.moveTo(b, -b); ctx.lineTo(-b, b);
      ctx.stroke();
    });

    // tige du bouton miroir, en écho à celle de la rotation
    ctx.strokeStyle = '#7B3FD3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2 + m);
    ctx.lineTo(0, h / 2 + m + r);
    ctx.stroke();

    // miroir, sous la forme : deux chevrons de part et d'autre d'un axe
    pastille(0, h / 2 + m + r, '#7B3FD3', function (b) {
      ctx.beginPath();
      ctx.moveTo(0, -b * 1.2); ctx.lineTo(0, b * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-b * 0.4, -b * 0.85); ctx.lineTo(-b * 1.25, 0);
      ctx.lineTo(-b * 0.4, b * 0.85);
      ctx.moveTo(b * 0.4, -b * 0.85); ctx.lineTo(b * 1.25, 0);
      ctx.lineTo(b * 0.4, b * 0.85);
      ctx.stroke();
    });

    // agrandissement, au coin bas droit : double flèche en diagonale
    pastille(w / 2 + m, h / 2 + m, '#7B3FD3', function (b) {
      ctx.beginPath();
      ctx.moveTo(-b, -b); ctx.lineTo(b, b);
      ctx.moveTo(-b, -b * 0.1); ctx.lineTo(-b, -b); ctx.lineTo(-b * 0.1, -b);
      ctx.moveTo(b, b * 0.1); ctx.lineTo(b, b); ctx.lineTo(b * 0.1, b);
      ctx.stroke();
    });

    ctx.restore();
  }

  /* Le point est-il dans le cadre de sélection de cette forme ? */
  function dansCadre(el, forme, xMm, yMm, margeMm) {
    var a = -(el.rot || 0);
    var d = dimensions(el, forme);
    var dx = xMm - el.x, dy = yMm - el.y;
    var lx = dx * Math.cos(a) - dy * Math.sin(a);
    var ly = dx * Math.sin(a) + dy * Math.cos(a);
    var m = MARGE_MM + (margeMm || 0);
    return Math.abs(lx) <= d.l / 2 + m && Math.abs(ly) <= d.h / 2 + m;
  }

  /* Quelle forme se trouve sous ce point ? (de la plus haute à la plus basse) */
  function formeSous(ctx, dessin, xMm, yMm, echelle) {
    for (var i = dessin.elements.length - 1; i >= 0; i--) {
      var el = dessin.elements[i];
      if (el.type !== 'forme') continue;
      var f = Formes.get(el.setId, el.formeId);
      if (!f || f.bande) continue;   // une bande se vise par son cadre
      ctx.save();
      transformeForme(ctx, el, f, echelle);
      var dedans = ctx.isPointInPath(f.path2d, xMm * echelle, yMm * echelle);
      ctx.restore();
      if (dedans) return el;
    }
    // deuxième passe, plus tolérante : les motifs fins sont durs à viser
    for (var j = dessin.elements.length - 1; j >= 0; j--) {
      var e2 = dessin.elements[j];
      if (e2.type !== 'forme') continue;
      var f2 = Formes.get(e2.setId, e2.formeId);
      if (f2 && dansCadre(e2, f2, xMm, yMm, 0)) return e2;
    }
    return null;
  }

  /* Sert à essayer différentes finesses de grain depuis outils/nacre.html. */
  function reglerGrain(mmParPixel) {
    MM_PAR_PIXEL = mmParPixel;
    tuiles = {};
    imagesTuiles = {};
  }

  /* La même tuile, en image, pour que les pastilles de la palette montrent le
     grain exact du dessin et non une imitation. */
  var imagesTuiles = {};
  function tuileEnImage(hex) {
    if (!imagesTuiles[hex]) imagesTuiles[hex] = tuileNacre(hex).toDataURL('image/png');
    return imagesTuiles[hex];
  }

  /* Côté d'une tuile en millimètres de peau : sert à la dimensionner ailleurs. */
  function cotéTuileMm() { return 128 * MM_PAR_PIXEL; }

  return {
    repere: repere, fond: fond, maquillage: maquillage, corps: corps,
    reglerGrain: reglerGrain, tuileEnImage: tuileEnImage, coteTuileMm: cotéTuileMm,
    selection: selection, poignees: poignees, dansCadre: dansCadre,
    formeSous: formeSous, transformeForme: transformeForme,
    versLocal: versLocal, rayon: rayon, trace: trace,
    dimensions: dimensions, MARGE_MM: MARGE_MM
  };
})();
