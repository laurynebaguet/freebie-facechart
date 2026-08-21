/* Fabrication de la fiche A4 à imprimer : le maquillage en grand, puis la
   liste du matériel utilisé avec les kits où le trouver. */
var Fiche = (function () {
  'use strict';

  var MARGE = 14;
  var PAGE_L = 210;
  var PAGE_H = 297;

  function chargerImage(src) {
    return new Promise(function (ok, ko) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { ko(new Error('image introuvable : ' + src)); };
      img.src = src;
    });
  }

  function couleurDe(id) {
    for (var i = 0; i < COULEURS.length; i++) if (COULEURS[i].id === id) return COULEURS[i];
    return null;
  }

  function kitsDe(couleur) {
    return (couleur.kits || []).map(function (k) {
      for (var i = 0; i < KITS.length; i++) if (KITS[i].id === k) return KITS[i];
      return null;
    }).filter(Boolean);
  }

  /* Ce que la personne a réellement employé, dans l'ordre d'apparition. */
  function inventaire(dessin) {
    var couleurs = [], formes = [], vusC = {}, vusF = {};
    dessin.elements.forEach(function (el) {
      if (el.couleurId && !vusC[el.couleurId]) {
        var c = couleurDe(el.couleurId);
        if (c) { vusC[el.couleurId] = true; couleurs.push(c); }
      }
      if (el.type === 'forme') {
        var cle = el.setId + '/' + el.formeId;
        if (!vusF[cle]) {
          var f = Formes.get(el.setId, el.formeId);
          if (f) { vusF[cle] = true; formes.push(f); }
        }
      }
    });
    return { couleurs: couleurs, formes: formes };
  }

  /* Rend le facechart maquillé sur une toile haute définition. */
  function rendre(visage, image, dessin, largeurPx) {
    var rep = Rendu.repere(visage);
    var echelle = largeurPx / rep.largeurMm;
    var hauteurPx = Math.round(rep.hauteurMm * echelle);

    var fond = document.createElement('canvas');
    fond.width = largeurPx; fond.height = hauteurPx;
    var fctx = fond.getContext('2d');
    fctx.fillStyle = '#ffffff';
    fctx.fillRect(0, 0, largeurPx, hauteurPx);
    Rendu.fond(fctx, image, rep, largeurPx);

    var couche = document.createElement('canvas');
    couche.width = largeurPx; couche.height = hauteurPx;
    var cctx = couche.getContext('2d');
    // toile de travail : sans elle, les morsures de gomme creuseraient aussi
    // ce qui se trouve dessous au lieu de la seule forme entamée
    var tampon = document.createElement('canvas');
    tampon.width = largeurPx; tampon.height = hauteurPx;
    Rendu.maquillage(cctx, dessin, echelle, function (id) {
      var c = couleurDe(id);
      return c ? c.hex : '#000';
    }, null, tampon);

    fctx.drawImage(couche, 0, 0);
    return fond;
  }

  /* Réduit une image avant de la glisser dans le PDF : sans ça, le logo y
     entre en pleine résolution et fait grossir le fichier de plusieurs Mo. */
  function reduire(img, largeurPx) {
    var c = document.createElement('canvas');
    c.width = largeurPx;
    c.height = Math.round(largeurPx * (img.naturalHeight / img.naturalWidth));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function hexVersRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  function construire(visage, image, dessin) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    var inv = inventaire(dessin);

    return chargerImage('images/marque/logo-violet.png').then(function (logo) {
      var y = MARGE;

      // --- en-tête
      var logoL = 52;
      var logoH = logoL * (logo.naturalHeight / logo.naturalWidth);
      doc.addImage(reduire(logo, 620), 'PNG', MARGE, y, logoL, logoH);
      y += logoH + 6;

      doc.setTextColor(123, 63, 211);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.text('Ta fiche de maquillage', MARGE, y);
      y += 7;

      doc.setTextColor(107, 100, 116);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text('Imprime cette page et garde-la à portée de main pendant le maquillage.', MARGE, y);
      y += 6;

      // --- le dessin
      // 1100 px pour 118 mm de large = environ 235 points par pouce :
      // largement assez net à l'impression, sans alourdir le fichier.
      var toile = rendre(visage, image, dessin, 1100);
      var dispoH = 150;
      var largeur = Math.min(118, dispoH * (toile.width / toile.height));
      var hauteur = largeur * (toile.height / toile.width);
      var x = (PAGE_L - largeur) / 2;

      doc.setDrawColor(232, 223, 212);
      doc.setLineWidth(0.4);
      doc.roundedRect(x - 2, y - 2, largeur + 4, hauteur + 4, 2, 2, 'S');
      doc.addImage(toile.toDataURL('image/jpeg', 0.82), 'JPEG', x, y, largeur, hauteur);
      y += hauteur + 10;

      // --- le materiel
      doc.setTextColor(58, 52, 64);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("Ce qu'il te faut", MARGE, y);
      y += 6;

      var colL = MARGE;
      var colR = PAGE_L / 2 + 2;
      var yG = y, yD = y;

      doc.setFontSize(10.5);
      doc.setTextColor(217, 72, 126);
      doc.text('Les couleurs', colL, yG); yG += 5.5;
      doc.text('Les pochoirs', colR, yD); yD += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(58, 52, 64);

      if (!inv.couleurs.length) {
        doc.setTextColor(140, 134, 148);
        doc.text('Aucune couleur utilisée.', colL, yG); yG += 5;
        doc.setTextColor(58, 52, 64);
      }
      inv.couleurs.forEach(function (c) {
        var rgb = hexVersRgb(c.hex);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.setDrawColor(200, 194, 208);
        doc.circle(colL + 2, yG - 1.2, 2, 'FD');
        doc.text(c.nom, colL + 6, yG);
        yG += 4.6;
        var kits = kitsDe(c);
        if (kits.length) {
          doc.setFontSize(8);
          doc.setTextColor(123, 63, 211);
          var libelle = 'dans ' + kits.map(function (k) { return k.nom; }).join(', ');
          doc.textWithLink(libelle, colL + 6, yG, { url: kits[0].lien });
          doc.setFontSize(9.5);
          doc.setTextColor(58, 52, 64);
          yG += 5;
        } else {
          yG += 1.2;
        }
      });

      if (!inv.formes.length) {
        doc.setTextColor(140, 134, 148);
        doc.text('Aucun pochoir utilisé.', colR, yD); yD += 5;
        doc.setTextColor(58, 52, 64);
      }
      var setsVus = {};
      inv.formes.forEach(function (f) {
        doc.text('• ' + f.nom, colR, yD);
        yD += 4.6;
        if (!setsVus[f.setId]) {
          setsVus[f.setId] = true;
          doc.setFontSize(8);
          doc.setTextColor(123, 63, 211);
          doc.textWithLink(f.setNom, colR + 3, yD, { url: f.setLien });
          doc.setFontSize(9.5);
          doc.setTextColor(58, 52, 64);
          yD += 5;
        } else {
          yD += 1.2;
        }
      });

      // --- pied de page
      doc.setDrawColor(232, 223, 212);
      doc.line(MARGE, PAGE_H - 16, PAGE_L - MARGE, PAGE_H - 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(123, 63, 211);
      doc.textWithLink(TEXTES.siteNom, MARGE, PAGE_H - 10, { url: TEXTES.siteLien });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 134, 148);
      doc.text('Retrouve tes pochoirs et tes couleurs sur la boutique.',
               PAGE_L - MARGE, PAGE_H - 10, { align: 'right' });

      return doc;
    });
  }

  function generer(visage, image, dessin) {
    return construire(visage, image, dessin).then(function (doc) {
      doc.save('maquillage-' + visage.id + '.pdf');
      return true;
    });
  }

  return {
    generer: generer, construire: construire, inventaire: inventaire,
    rendre: rendre, chargerImage: chargerImage
  };
})();
