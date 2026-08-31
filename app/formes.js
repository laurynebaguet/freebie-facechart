/* Construit, au démarrage, le catalogue des formes de pochoirs à partir des
   planches SVG brutes et de la configuration de donnees.js.

   Les unités des planches sont des millimètres (viewBox A4 = 210 x 297 mm),
   donc les tailles obtenues ici sont directement les tailles réelles.

   Une forme est faite d'un ou plusieurs « morceaux ». Chaque morceau est un
   sous-chemin de la planche, qu'on peut décaler et faire pivoter : c'est ce qui
   permet de composer un motif d'usage (les yeux et le nez du crâne côte à côte,
   et droits) alors que la découpe physique les place ailleurs et de travers.

   `rotBase` fait pivoter la forme entière pour la présenter dans le sens où on
   l'emploie : le chapeau de sorcière est couché sur la planche.

   Une forme peut aussi être une « bande » : le motif peint est alors le NÉGATIF
   du tracé dans une fenêtre, car sur un bord de planche la peinture passe
   autour du plastique. */
var Formes = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var catalogue = null;
  var parSet = null;

  /* De combien le rectangle d'une bande déborde de sa fenêtre, en mm. */
  var DEBORD = 8;

  function deg(rad) { return rad * 180 / Math.PI; }

  function mesureur() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '210');
    svg.setAttribute('height', '297');
    svg.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden';
    document.body.appendChild(svg);
    return svg;
  }

  /* Accepte soit un simple numéro de sous-chemin, soit { t, dx, dy, rot }. */
  function normaliser(trace) {
    if (typeof trace === 'number') return { t: trace, dx: 0, dy: 0, rot: 0 };
    return { t: trace.t, dx: trace.dx || 0, dy: trace.dy || 0, rot: trace.rot || 0 };
  }

  function transformeMorceau(m) {
    if (!m.dx && !m.dy && !m.rot) return null;
    var t = 'translate(' + m.dx + ',' + m.dy + ')';
    if (m.rot) t += ' rotate(' + deg(m.rot) + ',' + m.pcx + ',' + m.pcy + ')';
    return t;
  }

  function construire() {
    if (catalogue) return;
    catalogue = {};
    parSet = [];

    var svg = mesureur();
    // Deux groupes emboîtés : getBBox() d'un élément ignore sa PROPRE
    // transformation, on mesure donc le parent de celui qui tourne.
    var groupe = document.createElementNS(NS, 'g');
    var interne = document.createElementNS(NS, 'g');
    groupe.appendChild(interne);
    svg.appendChild(groupe);

    var traces = {};
    Object.keys(PLANCHES).forEach(function (k) {
      traces[k] = SubPaths.split(PLANCHES[k]);
    });

    // centre de chaque sous-chemin, pour pouvoir le faire pivoter sur lui-même
    var centres = {};
    Object.keys(traces).forEach(function (k) {
      centres[k] = traces[k].map(function (d) {
        interne.setAttribute('transform', '');
        while (interne.firstChild) interne.removeChild(interne.firstChild);
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        interne.appendChild(p);
        var bb = groupe.getBBox();
        return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
      });
    });

    function poser(morceaux, rotBase, cx, cy) {
      while (interne.firstChild) interne.removeChild(interne.firstChild);
      interne.setAttribute('transform',
        rotBase ? 'rotate(' + deg(rotBase) + ',' + cx + ',' + cy + ')' : '');
      morceaux.forEach(function (m) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', m.d);
        var t = transformeMorceau(m);
        if (t) p.setAttribute('transform', t);
        interne.appendChild(p);
      });
      return groupe.getBBox();
    }

    /* Le rectangle EXACT d'un motif redressé.

       `getBBox()` d'un groupe ne mesure pas ce qu'on croit : il réunit les
       rectangles de ses enfants une fois transformés, si bien qu'une forme
       tournée hérite du rectangle de son propre rectangle tourné — toujours
       plus grand que le dessin, et d'autant plus que l'angle approche 45°.
       Le chapeau de sorcière, couché à 66° sur la planche, flottait ainsi au
       milieu d'un cadre 20 % trop large et 60 % trop haut.

       On mesure donc le contour lui-même, point par point, dans le repère
       redressé. Un contour borne son remplissage : c'est bien le cadre du
       motif peint qu'on obtient. */
    function cadreTendu(morceaux, rotBase, pivot) {
      var base = new DOMMatrix();
      if (rotBase) {
        base = base.translate(pivot.x, pivot.y)
                   .rotate(deg(rotBase))
                   .translate(-pivot.x, -pivot.y);
      }
      interne.setAttribute('transform', '');
      while (interne.firstChild) interne.removeChild(interne.firstChild);

      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      morceaux.forEach(function (m) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', m.d);
        interne.appendChild(p);

        var mat = base;
        if (m.dx || m.dy) mat = mat.translate(m.dx, m.dy);
        if (m.rot) {
          mat = mat.translate(m.pcx, m.pcy).rotate(deg(m.rot))
                   .translate(-m.pcx, -m.pcy);
        }

        var L = p.getTotalLength();
        /* Un point tous les demi-millimètres, borné des deux côtés : en deçà
           un petit motif serait mal cerné, au-delà on ferait traîner le
           démarrage sur téléphone sans rien gagner de visible. */
        var n = Math.min(1200, Math.max(32, Math.ceil(L * 2)));
        for (var i = 0; i <= n; i++) {
          var pt = p.getPointAtLength(L * i / n);
          var X = mat.a * pt.x + mat.c * pt.y + mat.e;
          var Y = mat.b * pt.x + mat.d * pt.y + mat.f;
          if (X < minX) minX = X;
          if (X > maxX) maxX = X;
          if (Y < minY) minY = Y;
          if (Y > maxY) maxY = Y;
        }
        interne.removeChild(p);
      });

      if (minX > maxX) return null;
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    POCHOIRS.forEach(function (set) {
      var liste = traces[set.planche];
      var cent = centres[set.planche];
      var entree = { id: set.id, nom: set.nom, lien: set.lien, formes: [] };

      set.formes.forEach(function (f) {
        var rotBase = f.rotBase || 0;
        var morceaux = (f.traces || []).map(normaliser).map(function (m) {
          return {
            d: liste[m.t], dx: m.dx, dy: m.dy, rot: m.rot,
            pcx: cent[m.t].x, pcy: cent[m.t].y
          };
        });

        /* La rotation de présentation redresse le MOTIF, pas son cadre : une
           forme couchée sur la planche doit se manipuler comme les autres,
           cadre horizontal et poignées en haut.

           On mesure donc d'abord le motif brut, ce qui donne le pivot autour
           duquel on le redresse, puis le motif redressé, ce qui donne le cadre
           et son centre. */
        var brute = f.bande
          ? { x: f.bande.x, y: f.bande.y, width: f.bande.w, height: f.bande.h }
          : poser(morceaux, 0, 0, 0);
        var pivot = { x: brute.x + brute.width / 2, y: brute.y + brute.height / 2 };

        var redresse = brute;
        if (rotBase) {
          if (f.bande) {
            var co = Math.cos(rotBase), si = Math.sin(rotBase);
            var xs = [], ys = [];
            [[brute.x, brute.y], [brute.x + brute.width, brute.y],
             [brute.x, brute.y + brute.height],
             [brute.x + brute.width, brute.y + brute.height]].forEach(function (pt) {
              var dx = pt[0] - pivot.x, dy = pt[1] - pivot.y;
              xs.push(pivot.x + dx * co - dy * si);
              ys.push(pivot.y + dx * si + dy * co);
            });
            redresse = {
              x: Math.min.apply(null, xs), y: Math.min.apply(null, ys),
              width: Math.max.apply(null, xs) - Math.min.apply(null, xs),
              height: Math.max.apply(null, ys) - Math.min.apply(null, ys)
            };
          } else {
            // le cadre d'un motif tourné se mesure sur son contour, pas sur
            // le rectangle du groupe qui le porte
            redresse = cadreTendu(morceaux, rotBase, pivot)
                    || poser(morceaux, rotBase, pivot.x, pivot.y);
          }
        }
        var cx = redresse.x + redresse.width / 2;
        var cy = redresse.y + redresse.height / 2;
        var largeur = redresse.width, hauteur = redresse.height;

        /* Le rectangle qui sert à creuser la bande déborde volontairement de
           la fenêtre : superposé au tracé, son bord adouci ne s'annulerait pas
           exactement et laisserait un liseré tout autour du motif. On le fait
           déborder, et le rognage à la fenêtre exacte l'élimine. */
        /* Une bande « positive » montre le tracé lui-même, découpé dans une
           fenêtre, au lieu de son pourtour : c'est le cas quand le bord du
           plastique dessine le motif (des collines) et non l'inverse. */
        var chemin = new Path2D();
        if (f.bande && !f.bande.positif) {
          chemin.rect(f.bande.x - DEBORD, f.bande.y - DEBORD,
                      f.bande.w + 2 * DEBORD, f.bande.h + 2 * DEBORD);
        }
        morceaux.forEach(function (m) {
          var mat = new DOMMatrix();
          if (m.dx || m.dy) mat = mat.translate(m.dx, m.dy);
          if (m.rot) mat = mat.translate(m.pcx, m.pcy).rotate(deg(m.rot)).translate(-m.pcx, -m.pcy);
          chemin.addPath(new Path2D(m.d), mat);
        });

        var forme = {
          cle: set.id + '/' + f.id,
          id: f.id,
          nom: f.nom,
          setId: set.id,
          setNom: set.nom,
          setLien: set.lien,
          morceaux: morceaux,
          bande: f.bande || null,
          debord: DEBORD,
          rotBase: rotBase,
          pivot: pivot,        // autour duquel on redresse le motif
          cx: cx, cy: cy,      // centre du motif une fois redressé
          // facteur propre à la planche, appliqué à tous ses motifs
          echelleSet: set.echelle || 1,
          largeurMm: largeur * (set.echelle || 1),
          hauteurMm: hauteur * (set.echelle || 1),
          // rayon qui contient la forme quelle que soit sa rotation
          rayonMm: Math.hypot(largeur, hauteur) / 2 * (set.echelle || 1),
          path2d: chemin
        };
        catalogue[forme.cle] = forme;
        entree.formes.push(forme);
      });

      parSet.push(entree);
    });

    svg.parentNode.removeChild(svg);
  }

  return {
    init: construire,
    sets: function () { construire(); return parSet; },
    get: function (setId, formeId) { construire(); return catalogue[setId + '/' + formeId]; }
  };
})();
