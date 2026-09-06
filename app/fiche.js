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
  var L_GROUPE    = 5.4;   // le nom d'un kit ou d'une planche, et son air
  var L_ENTREE    = 4.6;   // le nom d'une couleur ou d'un motif
  var L_VIDE      = 5;     // « Aucune couleur utilisée. »

  /* Hauteur qu'occupera la liste du matériel, colonne la plus haute. */
  function hauteurMateriel(inv) {
    function colonne(groupes) {
      if (!groupes.length) return L_TITRE_COL + L_VIDE;
      return groupes.reduce(function (h, g) {
        return h + L_GROUPE + g.articles.length * L_ENTREE;
      }, L_TITRE_COL);
    }
    return Math.max(colonne(inv.parKit), colonne(inv.parPlanche));
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

  /* Ce que la personne a réellement employé, RANGÉ PAR CE QU'IL FAUT ACHETER :
     les couleurs par kit, les motifs par planche.

     Répéter « dans Kit A » sous chacune des trois couleurs du Kit A, c'est dire
     trois fois la même chose et prendre trois fois la place. Un titre de kit
     suivi de ses couleurs se lit d'un coup, et se retrouve en boutique de la
     même façon. Sur une fiche qui doit tenir sur une page, ce regroupement rend
     au dessin plusieurs centimètres.

     L'ordre reste celui d'apparition : les groupes sont classés par leur
     premier article, et chaque groupe garde ses articles dans l'ordre où on
     les a posés.

     Une couleur peut appartenir à PLUSIEURS kits. Elle ne figure pas deux fois
     pour autant : son groupe est alors la liste entière, « Kit A ou Kit B »,
     ce qui est justement la vérité de ce qu'on a à acheter — l'un OU l'autre.

     Renvoie deux listes de groupes de même forme :
       { titre, lien, articles: [...] } */
  function inventaire(dessin) {
    var parKit = [], indexK = {}, vusC = {};
    var parPlanche = [], indexP = {}, vusF = {};

    function ranger(liste, index, cle, titre, lien, article) {
      if (!index[cle]) {
        index[cle] = { titre: titre, lien: lien, articles: [] };
        liste.push(index[cle]);
      }
      index[cle].articles.push(article);
    }

    dessin.elements.forEach(function (el) {
      /* Ce qui a été entièrement effacé à la gomme n'a plus rien à peindre :
         on ne fait pas acheter le matériel d'un motif qui n'est plus là. */
      if (!Rendu.resteVisible(el)) return;

      if (el.couleurId && !vusC[el.couleurId]) {
        var c = couleurDe(el.couleurId);
        if (c) {
          vusC[el.couleurId] = true;
          var kits = kitsDe(c);
          ranger(parKit, indexK,
            kits.length ? kits.map(function (k) { return k.id; }).join('+') : '',
            kits.length ? kits.map(function (k) { return k.nom; }).join(' ou ')
                        : 'Autres couleurs',
            kits.length ? kits[0].lien : null,
            c);
        }
      }

      if (el.type === 'forme') {
        var cle = el.setId + '/' + el.formeId;
        if (!vusF[cle]) {
          var f = Formes.get(el.setId, el.formeId);
          if (f) {
            vusF[cle] = true;
            ranger(parPlanche, indexP, f.setId, f.setNom, f.setLien, f);
          }
        }
      }
    });

    return { parKit: parKit, parPlanche: parPlanche };
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
     entre en pleine résolution et fait grossir le fichier de plusieurs Mo.

     Le fond est peint en blanc d'abord. Le logo complet est un PNG à fond
     transparent, et selon la façon dont le PDF est ouvert, une transparence
     peut se retrouver rendue en noir. Sur une page blanche, ce carré blanc ne
     se voit pas et nous met à l'abri. */
  function reduire(img, largeurPx) {
    var c = document.createElement('canvas');
    c.width = largeurPx;
    c.height = Math.round(largeurPx * (img.naturalHeight / img.naturalWidth));
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
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
     que « de Yann » est alors la bonne forme.

     Un support qui n'est le visage de personne — la toile vierge — porte son
     propre titre, écrit dans donnees.js, au lieu du tour « Le maquillage
     de… » qui appelle un prénom. */
  function titrePour(nom, visage) {
    if (visage && visage.titre) return visage.titre;
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

    return chargerImage('images/marque/logo-principal.png').then(function (logo) {
      /* --- en-tête : le titre à gauche, le logo dans le coin en haut à droite.

         Le lettrage prenait toute la largeur au-dessus du titre et disait deux
         fois « La Baguette Maquille » — une fois en haut, une fois en pied de
         page. Le logo complet, posé dans le coin, signe la feuille sans lui
         prendre de hauteur : la place ainsi rendue revient au dessin. */
      var logoL = 36;
      var logoH = logoL * (logo.naturalHeight / logo.naturalWidth);
      /* Il a sa propre marge, plus courte que celle du texte : une signature
         se pose au bord de la feuille, elle ne s'aligne pas sur le corps. */
      var logoM = 9;
      doc.addImage(reduire(logo, 500), 'PNG',
                   PAGE_L - logoM - logoL, logoM, logoL, logoH);

      var y = MARGE + 7;

      doc.setTextColor(123, 63, 211);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      /* Au prénom que la personne a donné au visage : une fiche qui porte le
         prénom de son enfant se garde, une fiche générique se jette. */
      doc.text(titrePour(nom || visage.nom, visage), MARGE, y);
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

      doc.setFontSize(10.5);
      doc.setTextColor(217, 72, 126);
      doc.text('Les couleurs', colL, y);
      doc.text('Les pochoirs', colR, y);

      /* Les deux colonnes se dessinent pareil : un titre de kit ou de planche,
         puis ce qu'il contient, décalé sous lui. Seule la puce change — une
         pastille de la vraie couleur à gauche, un point à droite. */
      function colonne(groupes, x, motVide, puce) {
        var yc = y + L_TITRE_COL;
        if (!groupes.length) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(140, 134, 148);
          doc.text(motVide, x, yc);
          return;
        }
        groupes.forEach(function (g) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(123, 63, 211);
          if (g.lien) doc.textWithLink(g.titre, x, yc, { url: g.lien });
          else doc.text(g.titre, x, yc);
          yc += L_GROUPE;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(58, 52, 64);
          g.articles.forEach(function (a) {
            puce(a, x, yc);
            doc.text(a.nom, x + 6, yc);
            yc += L_ENTREE;
          });
        });
      }

      colonne(inv.parKit, colL, 'Aucune couleur utilisée.', function (c, x, yc) {
        var rgb = hexVersRgb(c.hex);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.setDrawColor(200, 194, 208);
        doc.circle(x + 2, yc - 1.2, 2, 'FD');
      });

      colonne(inv.parPlanche, colR, 'Aucun pochoir utilisé.', function (f, x, yc) {
        doc.text('•', x + 1, yc);
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
