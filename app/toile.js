/* La toile de dessin : affichage du facechart, pose des pochoirs, pinceau,
   gomme, sélection et manipulation des formes déjà posées.

   Pendant un geste, on redessine directement la toile sans repasser par React :
   c'est ce qui rend le trait fluide au doigt. Les props sont relues à travers
   une référence, pour qu'une image tardive ne réaffiche jamais un état périmé. */
var Toile = (function () {
  'use strict';
  var html = htm.bind(React.createElement);
  var useRef = React.useRef, useEffect = React.useEffect, useCallback = React.useCallback;

  var POIGNEE_MM = 9;      // rayon des boutons autour d'une forme choisie
  var PAS_MM = 0.35;       // distance minimale entre deux points d'un trait
  /* Marge d'adaptation d'un pochoir au visage qu'on maquille. Volontairement
     étroite : un pochoir a une taille physique, on l'ajuste d'un enfant à
     l'autre — entre 3 et 10 ans l'écart réel est d'environ 20 % — mais on ne
     le triple pas, ce serait irréalisable au tampon. */
  var ZOOM_MIN = 0.7;
  var ZOOM_MAX = 1.5;

  function couleurDe(id) {
    for (var i = 0; i < COULEURS.length; i++) {
      if (COULEURS[i].id === id) return COULEURS[i].hex;
    }
    return '#000';
  }

  /* Boîte englobante d'un élément, en mm du visage. */
  function boite(el) {
    if (el.type === 'forme') {
      var f = Formes.get(el.setId, el.formeId);
      var r = f ? Math.hypot(f.largeurMm, f.hauteurMm) / 2 * (el.zoom || 1) : 0;
      return { x1: el.x - r, y1: el.y - r, x2: el.x + r, y2: el.y + r };
    }
    var m = (el.taille || 0) / 2;
    var b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
    el.points.forEach(function (p) {
      if (p[0] < b.x1) b.x1 = p[0];
      if (p[0] > b.x2) b.x2 = p[0];
      if (p[1] < b.y1) b.y1 = p[1];
      if (p[1] > b.y2) b.y2 = p[1];
    });
    return { x1: b.x1 - m, y1: b.y1 - m, x2: b.x2 + m, y2: b.y2 + m };
  }

  function seCroisent(a, b) {
    return a.x1 <= b.x2 && b.x1 <= a.x2 && a.y1 <= b.y2 && b.y1 <= a.y2;
  }

  function Composant(p) {
    var canvasRef = useRef(null);
    var boiteRef = useRef(null);
    var horsRef = useRef(null);
    var tamponRef = useRef(null);
    var vueRef = useRef({ largeur: 0, hauteur: 0, echelle: 1, dpr: 1 });
    var gesteRef = useRef(null);
    var brouillonRef = useRef(null);   // trait ou gomme en cours
    var glisseRef = useRef(null);      // forme en cours de déplacement
    var survolRef = useRef(null);      // position du curseur, pour l'aperçu
    var frameRef = useRef(0);
    var propsRef = useRef(p);
    propsRef.current = p;

    var rep = Rendu.repere(p.visage);

    /* ------------------------------------------------------------ rendu */

    /* Le pochoir en attente, montré en transparence sous le curseur. */
    function apercuPochoir() {
      var q = propsRef.current;
      var s = survolRef.current;
      if (brouillonRef.current || !s) return null;
      if (!q.formeChoisie || q.outil !== 'pochoir') return null;
      if (s.surSelection) return null;   // ici, on manipulerait la sélection
      return {
        type: 'forme', setId: q.formeChoisie.setId, formeId: q.formeChoisie.id,
        couleurId: q.couleurId, x: s.x, y: s.y, rot: 0, miroir: false
      };
    }

    /* Cercle montrant la largeur du pinceau ou de la gomme. */
    function apercuRond(ctx, e) {
      var q = propsRef.current;
      var s = survolRef.current;
      if (!s || gesteRef.current) return;
      if (q.outil !== 'pinceau' && q.outil !== 'gomme') return;
      var t = (q.outil === 'gomme' ? q.tailleGomme : q.taillePinceau) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x * e, s.y * e, Math.max(2, t * e), 0, Math.PI * 2);
      ctx.strokeStyle = q.outil === 'gomme' ? '#3A3440' : couleurDe(q.couleurId);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    /* Taille réelle du motif, affichée au-dessus de lui pendant qu'on le
       redimensionne : c'est la mesure qui compte pour maquiller pour de vrai. */
    function etiquetteTaille(ctx, el, echelle) {
      var f = Formes.get(el.setId, el.formeId);
      if (!f) return;
      var d = Rendu.dimensions(el, f);
      var texte = Math.round(d.l) + ' × ' + Math.round(d.h) + ' mm';
      var x = el.x * echelle;
      var y = (el.y - d.h / 2 - Rendu.MARGE_MM) * echelle - 26;
      ctx.save();
      ctx.font = '600 13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var l = ctx.measureText(texte).width + 16;
      ctx.fillStyle = 'rgba(58,52,64,.92)';
      ctx.beginPath();
      ctx.roundRect(x - l / 2, y - 11, l, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(texte, x, y);
      ctx.restore();
    }

    function redessiner() {
      var q = propsRef.current;
      var c = canvasRef.current;
      if (!c || !q.image) return;
      var v = vueRef.current;
      if (!v.largeur) return;
      var ctx = c.getContext('2d');

      ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      ctx.clearRect(0, 0, v.largeur, v.hauteur);
      Rendu.fond(ctx, q.image, Rendu.repere(q.visage), v.largeur);

      // couche maquillage, à part, pour que la gomme n'attaque pas le visage
      var hors = horsRef.current;
      var hctx = hors.getContext('2d');
      hctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      hctx.clearRect(0, 0, v.largeur, v.hauteur);

      var glisse = glisseRef.current;
      var elements = q.dessin.elements;
      if (glisse) {
        elements = elements.map(function (el) {
          return el.id === glisse.id
            ? Object.assign({}, el, {
                x: glisse.x, y: glisse.y, rot: glisse.rot, zoom: glisse.zoom
              })
            : el;
        });
      }

      var brouillon = brouillonRef.current;
      Rendu.maquillage(hctx, { elements: elements }, v.echelle, couleurDe,
                       brouillon && brouillon.type === 'trait' ? brouillon : null,
                       tamponRef.current);

      // La gomme creuse pendant le geste, sinon on efface à l'aveugle. Ce
      // n'est qu'un aperçu : au relâchement, la morsure est rangée dans
      // chaque forme entamée pour qu'elle la suive ensuite.
      if (brouillon && brouillon.type === 'gomme') {
        hctx.save();
        hctx.globalCompositeOperation = 'destination-out';
        hctx.strokeStyle = 'rgba(0,0,0,1)';
        Rendu.trace(hctx, brouillon.points, brouillon.taille, v.echelle);
        hctx.restore();
      }

      var apercu = apercuPochoir();
      if (apercu) {
        hctx.globalAlpha = 0.45;
        Rendu.corps(hctx, apercu, v.echelle, couleurDe);
        hctx.globalAlpha = 1;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(hors, 0, 0);
      ctx.restore();

      if (q.selectionId != null) {
        var sel = null;
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].id === q.selectionId) { sel = elements[i]; break; }
        }
        if (sel && sel.type === 'forme') {
          Rendu.selection(ctx, sel, v.echelle, POIGNEE_MM);
          // pendant qu'on tire, on annonce la taille réelle obtenue
          var g = gesteRef.current;
          if (g && g.mode === 'redim') etiquetteTaille(ctx, sel, v.echelle);
        }
      }

      apercuRond(ctx, v.echelle);
    }

    function planifier() {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(function () {
        frameRef.current = 0;
        redessiner();
      });
    }

    /* ------------------------------------------------------ dimensions */

    function ajuster() {
      var b = boiteRef.current, c = canvasRef.current;
      if (!b || !c) return;
      // clientWidth inclut le rembourrage : sans le retirer, la toile calculée
      // déborde, le CSS la rétrécit, et le pointeur se retrouve décalé.
      var st = window.getComputedStyle(b);
      var dispoL = b.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
      var dispoH = b.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom);
      if (dispoL <= 0 || dispoH <= 0) return;

      var r = Rendu.repere(propsRef.current.visage);
      var ratio = r.largeurMm / r.hauteurMm;
      var largeur = Math.min(dispoL, dispoH * ratio);
      var hauteur = largeur / ratio;
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      vueRef.current = {
        largeur: largeur, hauteur: hauteur,
        echelle: largeur / r.largeurMm, dpr: dpr
      };

      [c, horsRef.current, tamponRef.current].forEach(function (t) {
        t.width = Math.round(largeur * dpr);
        t.height = Math.round(hauteur * dpr);
      });
      c.style.width = largeur + 'px';
      c.style.height = hauteur + 'px';
      if (propsRef.current.onEchelle) propsRef.current.onEchelle(vueRef.current.echelle);
      redessiner();
    }

    useEffect(function () {
      horsRef.current = document.createElement('canvas');
      tamponRef.current = document.createElement('canvas');
      ajuster();
      var ro = new ResizeObserver(ajuster);
      if (boiteRef.current) ro.observe(boiteRef.current);
      window.addEventListener('orientationchange', ajuster);
      return function () {
        ro.disconnect();
        window.removeEventListener('orientationchange', ajuster);
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }, []);

    useEffect(function () { ajuster(); }, [p.visage.id, p.image]);

    // Une image déjà planifiée dessinerait l'état précédent : on l'annule.
    useEffect(function () {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      redessiner();
    });

    /* ------------------------------------------------------- géométrie */

    function enMm(ev) {
      var r = canvasRef.current.getBoundingClientRect();
      var e = vueRef.current.echelle;
      return { x: (ev.clientX - r.left) / e, y: (ev.clientY - r.top) / e };
    }

    function selectionCourante() {
      var q = propsRef.current;
      if (q.selectionId == null) return null;
      var el = Modele.trouver(q.dessin, q.selectionId);
      if (!el || el.type !== 'forme') return null;
      var f = Formes.get(el.setId, el.formeId);
      return f ? { el: el, f: f } : null;
    }

    /* Que vise-t-on à cet endroit ? */
    function cible(pt) {
      var s = selectionCourante();
      if (!s) return null;
      var pg = Rendu.poignees(s.el, s.f, POIGNEE_MM);
      if (Math.hypot(pt.x - pg.poubelle.x, pt.y - pg.poubelle.y) <= POIGNEE_MM * 0.75) {
        return { quoi: 'poubelle', sel: s };
      }
      if (Math.hypot(pt.x - pg.miroir.x, pt.y - pg.miroir.y) <= POIGNEE_MM * 0.75) {
        return { quoi: 'miroir', sel: s };
      }
      if (Math.hypot(pt.x - pg.redim.x, pt.y - pg.redim.y) <= POIGNEE_MM * 0.75) {
        return { quoi: 'redim', sel: s };
      }
      if (Math.hypot(pt.x - pg.rotation.x, pt.y - pg.rotation.y) <= POIGNEE_MM * 0.75) {
        return { quoi: 'rotation', sel: s };
      }
      if (Rendu.dansCadre(s.el, s.f, pt.x, pt.y, 0)) {
        return { quoi: 'cadre', sel: s };
      }
      return null;
    }

    function curseurPour(pt) {
      var q = propsRef.current;
      var c = cible(pt);
      if (c) {
        if (c.quoi === 'poubelle' || c.quoi === 'miroir') return 'pointer';
        if (c.quoi === 'redim') return 'nwse-resize';
        return 'grab';
      }
      if (q.outil === 'modifier') return 'default';
      if (q.outil === 'pochoir') return 'copy';
      return 'crosshair';
    }

    /* ---------------------------------------------------------- gestes */

    function onDown(ev) {
      var q = propsRef.current;
      var c = canvasRef.current;
      c.setPointerCapture(ev.pointerId);
      var pt = enMm(ev);
      var ctx = c.getContext('2d');
      var e = vueRef.current.echelle;
      survolRef.current = null;

      // 1. le geste porte-t-il sur la forme déjà sélectionnée ?
      var vise = cible(pt);
      if (vise) {
        if (vise.quoi === 'poubelle') {
          gesteRef.current = null;
          p.onSupprimer(vise.sel.el.id);
          return;
        }
        if (vise.quoi === 'miroir') {
          gesteRef.current = null;
          p.onMiroir(vise.sel.el.id);
          return;
        }
        p.appliquer(null, 'debut');
        var el = vise.sel.el;
        glisseRef.current = {
          id: el.id, x: el.x, y: el.y, rot: el.rot || 0, zoom: el.zoom || 1
        };
        if (vise.quoi === 'rotation') {
          gesteRef.current = { mode: 'rotation' };
        } else if (vise.quoi === 'redim') {
          // on garde le rapport entre la distance au centre et la taille
          var d0 = Math.hypot(pt.x - el.x, pt.y - el.y);
          gesteRef.current = {
            mode: 'redim',
            reference: d0 > 0.5 ? d0 / (el.zoom || 1) : null
          };
          c.style.cursor = 'nwse-resize';
          planifier();
          return;
        } else {
          // manipuler la sélection prime sur l'outil courant
          if (q.outil !== 'modifier') p.onOutil('modifier');
          gesteRef.current = { mode: 'deplacement', dx: el.x - pt.x, dy: el.y - pt.y };
        }
        c.style.cursor = 'grabbing';
        planifier();
        return;
      }

      // 2. pose d'un nouveau pochoir. La pose et l'ajustement qui suit ne
      // forment qu'une seule étape d'annulation.
      if (q.outil === 'pochoir' && q.formeChoisie) {
        var idPose = q.dessin.seq;
        var neuf = {
          type: 'forme', setId: q.formeChoisie.setId, formeId: q.formeChoisie.id,
          couleurId: q.couleurId, x: pt.x, y: pt.y, rot: 0,
          zoom: 1, miroir: false, gommes: []
        };
        p.appliquer(function (d) { return Modele.ajouter(d, neuf); }, 'debut');
        p.onSelection(idPose);
        gesteRef.current = { mode: 'deplacement', dx: 0, dy: 0 };
        glisseRef.current = { id: idPose, x: pt.x, y: pt.y, rot: 0, zoom: 1 };
        c.style.cursor = 'grabbing';
        return;
      }

      // 3. attraper une forme déjà posée
      if (q.outil === 'modifier') {
        var sous = Rendu.formeSous(ctx, q.dessin, pt.x, pt.y, e);
        p.onSelection(sous ? sous.id : null);
        if (sous) {
          p.appliquer(null, 'debut');
          gesteRef.current = { mode: 'deplacement', dx: sous.x - pt.x, dy: sous.y - pt.y };
          glisseRef.current = {
            id: sous.id, x: sous.x, y: sous.y,
            rot: sous.rot || 0, zoom: sous.zoom || 1
          };
          c.style.cursor = 'grabbing';
        }
        return;
      }

      // 4. pinceau ou gomme
      p.onSelection(null);
      brouillonRef.current = q.outil === 'gomme'
        ? { type: 'gomme', taille: q.tailleGomme, points: [[pt.x, pt.y]] }
        : { type: 'trait', couleurId: q.couleurId, taille: q.taillePinceau,
            points: [[pt.x, pt.y]], gommes: [] };
      gesteRef.current = { mode: 'trace' };
      planifier();
    }

    function onMove(ev) {
      var g = gesteRef.current;
      var pt = enMm(ev);

      if (!g) {
        // simple survol : on met à jour l'aperçu
        var vise = cible(pt);
        survolRef.current = { x: pt.x, y: pt.y, surSelection: !!vise };
        canvasRef.current.style.cursor = curseurPour(pt);
        planifier();
        return;
      }

      if (g.mode === 'trace') {
        var pts = brouillonRef.current.points;
        var dernier = pts[pts.length - 1];
        if (Math.hypot(pt.x - dernier[0], pt.y - dernier[1]) >= PAS_MM) {
          pts.push([pt.x, pt.y]);
          planifier();
        }
        return;
      }

      if (g.mode === 'deplacement') {
        glisseRef.current.x = pt.x + g.dx;
        glisseRef.current.y = pt.y + g.dy;
        planifier();
        return;
      }

      if (g.mode === 'rotation') {
        var gl = glisseRef.current;
        gl.rot = Math.atan2(pt.x - gl.x, gl.y - pt.y);
        planifier();
        return;
      }

      if (g.mode === 'redim' && g.reference) {
        var gz = glisseRef.current;
        var d = Math.hypot(pt.x - gz.x, pt.y - gz.y);
        gz.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, d / g.reference));
        planifier();
      }
    }

    /* Range la trace de gomme dans chaque élément qu'elle entame. */
    function poserGomme(brouillon) {
      var bg = boite({ type: 'trait', points: brouillon.points, taille: brouillon.taille });
      p.appliquer(function (d) {
        return Modele.gommer(d, function (el) {
          if (!seCroisent(bg, boite(el))) return null;
          var f = el.type === 'forme' ? Formes.get(el.setId, el.formeId) : null;
          if (el.type === 'forme' && !f) return null;
          return {
            taille: brouillon.taille,
            points: brouillon.points.map(function (pt) {
              var l = Rendu.versLocal(el, f, pt[0], pt[1]);
              return [l.x, l.y];
            })
          };
        });
      }, 'fin');
    }

    function onUp(ev) {
      var g = gesteRef.current;
      gesteRef.current = null;
      try { canvasRef.current.releasePointerCapture(ev.pointerId); } catch (e) {}
      canvasRef.current.style.cursor = curseurPour(enMm(ev));
      if (!g) return;

      if (g.mode === 'trace') {
        var brouillon = brouillonRef.current;
        brouillonRef.current = null;
        if (brouillon && brouillon.points.length) {
          if (brouillon.type === 'gomme') poserGomme(brouillon);
          else p.appliquer(function (d) { return Modele.ajouter(d, brouillon); }, 'fin');
        }
        return;
      }

      var gl = glisseRef.current;
      glisseRef.current = null;
      if (gl) {
        p.appliquer(function (d) {
          return Modele.modifier(d, gl.id, {
            x: gl.x, y: gl.y, rot: gl.rot, zoom: gl.zoom
          });
        }, 'fin');
      }
    }

    function onSortie() {
      if (gesteRef.current) return;
      survolRef.current = null;
      planifier();
    }

    function onAnnuleGeste() {
      gesteRef.current = null;
      brouillonRef.current = null;
      glisseRef.current = null;
      survolRef.current = null;
      planifier();
    }

    return html`
      <div class="scene" ref=${boiteRef}>
        <canvas
          ref=${canvasRef}
          onPointerDown=${onDown}
          onPointerMove=${onMove}
          onPointerUp=${onUp}
          onPointerLeave=${onSortie}
          onPointerCancel=${onAnnuleGeste}
        ></canvas>
        ${p.enfants}
      </div>`;
  }

  return Composant;
})();
