/* Fabrication de la fiche A4 à imprimer : le maquillage en grand, puis la
   liste du matériel utilisé avec les kits où le trouver. */
var Fiche = (function () {
  'use strict';

  var MARGE = 14;
  var PAGE_L = 210;
  var PAGE_H = 297;

  /* Taille du dessin sur la page. Volontairement en deçà des 182 mm
     disponibles : au-delà, la tête devient envahissante et surtout très
     gourmande en encre couleur — le dessin est une grande surface pleine, et
     l'agrandir coûte au carré. À 132 mm, un visage large comme celui de Lou
     consomme environ un quart d'encre de plus qu'à 118, ce qui reste
     raisonnable pour une impression maison. Baisse ces deux nombres si les
     retours parlent d'impressions trop chargées. */
  var DESSIN_L_MAX = 132;
  var DESSIN_H_MAX = 145;

  /* Emplacement du QR code dans le bloc d'appel. 30 mm est la taille sous
     laquelle un code cesse d'être lu de façon fiable par un téléphone tenu à
     bout de bras. */
  var QR_COTE = 30;

  /* Hauteur d'une ligne de la liste du matériel. Ces nombres servent DEUX
     fois : à mesurer la liste avant de dessiner quoi que ce soit, puis à la
     tracer. Sans la mesure préalable, un maquillage qui emploie beaucoup de
     couleurs pousse le bloc d'appel hors de la page. */
  var L_TITRE_COL = 5.5;   // « Les couleurs » / « Les pochoirs »
  var L_ENTREE    = 4.6;   // le nom d'une couleur ou d'un motif
  var L_SOUS      = 5;     // la ligne « dans Kit A » en dessous
  var L_SANS      = 1.2;   // l'écart quand cette ligne-là n'est pas répétée
  var L_VIDE      = 5;     // « Aucune couleur utilisée. »

  /* Hauteur qu'occupera la liste du matériel, colonne la plus haute. */
  function hauteurMateriel(inv) {
    var g = L_TITRE_COL, d = L_TITRE_COL;

    if (!inv.couleurs.length) g += L_VIDE;
    inv.couleurs.forEach(function (c) {
      g += L_ENTREE + (kitsDe(c).length ? L_SOUS : L_SANS);
    });

    if (!inv.formes.length) d += L_VIDE;
    var vus = {};
    inv.formes.forEach(function (f) {
      d += L_ENTREE;
      if (!vus[f.setId]) { vus[f.setId] = true; d += L_SOUS; } else { d += L_SANS; }
    });

    return Math.max(g, d);
  }

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

  /* La première lettre d'un prénom, sans son accent et en minuscule. */
  function initiale(nom) {
    return (nom || '').trim().charAt(0)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /* « Le maquillage d'Anna », et non « de Anna ».

     On élide devant une voyelle, et devant un h : dans les prénoms il est
     presque toujours muet (Hélène, Henri, Hortense). Le y est laissé de côté,
     parce qu'il sonne le plus souvent comme une consonne (Yann, Yasmine) et
     que « de Yann » est alors la bonne forme. */
  function titrePour(nom) {
    var i = initiale(nom);
    return (/[aeiouh]/.test(i) ? TEXTES.titreElide : TEXTES.titreDe) + nom;
  }

  /* Un nom de fichier sans accent ni espace : certains téléphones et certaines
     messageries abîment le reste. */
  function limace(texte) {
    return (texte || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'facechart';
  }

  /* Bloc d'appel du bas de page : le QR code à gauche, l'invitation à droite.
     Renvoie la hauteur occupée. */
  function appel(doc, y) {
    var largeur = PAGE_L - 2 * MARGE;
    var hauteur = QR_COTE + 12;

    doc.setFillColor(248, 243, 255);
    doc.setDrawColor(226, 213, 246);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGE, y, largeur, hauteur, 3, 3, 'FD');

    var qrX = MARGE + 6;
    var qrY = y + 6;

    if (APPEL_FICHE.qr) {
      doc.addImage(APPEL_FICHE.qr, 'PNG', qrX, qrY, QR_COTE, QR_COTE);
    } else {
      /* Emplacement réservé : on imprime le cadre à sa taille définitive pour
         que la mise en page soit déjà la bonne, sans faire croire à un code
         scannable. */
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(196, 176, 228);
      doc.setLineWidth(0.5);
      doc.roundedRect(qrX, qrY, QR_COTE, QR_COTE, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(150, 130, 185);
      doc.text('QR CODE', qrX + QR_COTE / 2, qrY + QR_COTE / 2 - 1,
               { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('à venir', qrX + QR_COTE / 2, qrY + QR_COTE / 2 + 3.5,
               { align: 'center' });
    }

    var texteX = qrX + QR_COTE + 8;
    var texteL = PAGE_L - MARGE - 6 - texteX;
    var ty = y + 13;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(123, 63, 211);
    doc.text(APPEL_FICHE.titre, texteX, ty);
    ty += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(58, 52, 64);
    doc.text(doc.splitTextToSize(APPEL_FICHE.texte, texteL), texteX, ty);

    return hauteur;
  }

  function construire(visage, image, dessin, nom) {
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
      /* Au prénom que la personne a donné au visage : une fiche qui porte le
         prénom de son enfant se garde, une fiche générique se jette. */
      doc.text(titrePour(nom || visage.nom), MARGE, y);
      y += 7;

      doc.setTextColor(107, 100, 116);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text('Imprime cette page et garde-la à portée de main pendant le maquillage.', MARGE, y);
      y += 6;

      // --- le dessin
      // 1100 px pour 132 mm de large = environ 210 points par pouce :
      // largement assez net à l'impression, sans alourdir le fichier.
      var toile = rendre(visage, image, dessin, 1100);
      var proportions = toile.width / toile.height;

      /* Le dessin prend la place qui reste une fois le bloc d'appel et la
         liste du matériel réservés, sans jamais dépasser sa taille de confort.
         C'est lui qui cède, parce qu'un maquillage un peu plus petit vaut
         mieux qu'une fiche qui déborde sur une deuxième page. */
      var hautAppel = QR_COTE + 12;
      var basDeZone = PAGE_H - 22 - hautAppel;
      var reste = basDeZone - y - 10 - 6 - hauteurMateriel(inv) - 4;
      var hautDispo = Math.max(70, Math.min(DESSIN_H_MAX, reste));

      var largeur = Math.min(DESSIN_L_MAX, hautDispo * proportions);
      var hauteur = largeur / proportions;
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
      doc.text('Les couleurs', colL, yG); yG += L_TITRE_COL;
      doc.text('Les pochoirs', colR, yD); yD += L_TITRE_COL;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(58, 52, 64);

      if (!inv.couleurs.length) {
        doc.setTextColor(140, 134, 148);
        doc.text('Aucune couleur utilisée.', colL, yG); yG += L_VIDE;
        doc.setTextColor(58, 52, 64);
      }
      inv.couleurs.forEach(function (c) {
        var rgb = hexVersRgb(c.hex);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.setDrawColor(200, 194, 208);
        doc.circle(colL + 2, yG - 1.2, 2, 'FD');
        doc.text(c.nom, colL + 6, yG);
        yG += L_ENTREE;
        var kits = kitsDe(c);
        if (kits.length) {
          doc.setFontSize(8);
          doc.setTextColor(123, 63, 211);
          var libelle = 'dans ' + kits.map(function (k) { return k.nom; }).join(', ');
          doc.textWithLink(libelle, colL + 6, yG, { url: kits[0].lien });
          doc.setFontSize(9.5);
          doc.setTextColor(58, 52, 64);
          yG += L_SOUS;
        } else {
          yG += L_SANS;
        }
      });

      if (!inv.formes.length) {
        doc.setTextColor(140, 134, 148);
        doc.text('Aucun pochoir utilisé.', colR, yD); yD += L_VIDE;
        doc.setTextColor(58, 52, 64);
      }
      var setsVus = {};
      inv.formes.forEach(function (f) {
        doc.text('• ' + f.nom, colR, yD);
        yD += L_ENTREE;
        if (!setsVus[f.setId]) {
          setsVus[f.setId] = true;
          doc.setFontSize(8);
          doc.setTextColor(123, 63, 211);
          doc.textWithLink(f.setNom, colR + 3, yD, { url: f.setLien });
          doc.setFontSize(9.5);
          doc.setTextColor(58, 52, 64);
          yD += L_SOUS;
        } else {
          yD += L_SANS;
        }
      });

      // --- le bloc d'appel, calé juste au-dessus du pied de page
      /* Calé au-dessus du pied de page, à une place fixe : le dessin a déjà
         cédé ce qu'il fallait pour que la liste s'arrête avant. */
      appel(doc, basDeZone);

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
      doc.setFontSize(7.5);
      doc.setTextColor(158, 152, 166);
      doc.text(TEXTES.credit, MARGE, PAGE_H - 5.5);

      return doc;
    });
  }

  function generer(visage, image, dessin, nom) {
    return construire(visage, image, dessin, nom).then(function (doc) {
      doc.save('maquillage-' + limace(nom || visage.nom) + '.pdf');
      return true;
    });
  }

  return {
    generer: generer, construire: construire, inventaire: inventaire,
    rendre: rendre, chargerImage: chargerImage, limace: limace,
    titrePour: titrePour
  };
})();
