/* Fabrication de la fiche A4 à imprimer : le maquillage en grand, puis la
   liste d'achats pour le refaire (la même que l'écran récap) et le QR code
   qui met tout au panier. */
var Fiche = (function () {
  'use strict';

  var MARGE = 14;
  var PAGE_L = 210;
  var PAGE_H = 297;

  /* Taille du dessin sur la page. Volontairement en deçà des 182 mm
     disponibles : au-delà, la tête devient envahissante et surtout très
     gourmande en encre couleur — le dessin est une grande surface pleine, et
     l'agrandir coûte au carré. À 132 mm, un visage large comme celui de Zoé
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
  var L_ACHAT = 6;   // une ligne de la liste d'achats
  var L_VIDE  = 5;   // « Aucun matériel utilisé. »

  /* Hauteur qu'occupera la liste d'achats : deux colonnes, la gauche
     remplie d'abord. */
  function hauteurMateriel(inv) {
    var n = achats(inv).length;
    return n ? Math.ceil(n / 2) * L_ACHAT : L_VIDE;
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
       { titre, lien, articles: [...] }
     et, dans `kits` et `flacons`, ce qu'il faut acheter pour le refaire (le
     même panier que celui du QR code). */
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

    var panier = panierDe(dessin);
    return {
      parKit: parKit, parPlanche: parPlanche,
      kits: KITS.filter(function (k) { return panier.kits.indexOf(k.id) >= 0; }),
      coffrets: COFFRETS.filter(function (c) { return panier.coffrets.indexOf(c.id) >= 0; }),
      pinceaux: panier.pinceaux,
      planches: POCHOIRS.filter(function (s) { return panier.planches.indexOf(s.id) >= 0; }),
      flacons: COULEURS.filter(function (c) { return panier.flacons.indexOf(c.id) >= 0; })
    };
  }

  /* La liste d'achats, une ligne par article, dans l'ordre du panier :
     coffrets, kits, planches seules, flacons, pinceaux. Chaque ligne :
     { cle, nom, lien, et soit hex (flacons : la pastille de la couleur),
     soit icone (le reste : voir app/icones.js) }. La même liste sert à
     l'écran récap et à la fiche PDF : elles ne peuvent pas se contredire. */
  function achats(inv) {
    return inv.coffrets.map(function (c) {
      return { cle: 'coffret-' + c.id, nom: c.nom, lien: c.lien, icone: c.icone };
    }).concat(inv.kits.map(function (k) {
      return { cle: 'kit-' + k.id, nom: 'Kit « ' + k.nom + ' »', lien: k.lien, icone: k.icone };
    })).concat(inv.planches.map(function (s) {
      return { cle: 'planche-' + s.id, nom: 'Planche « ' + s.nom + ' »', lien: s.lien, icone: s.icone };
    })).concat(inv.flacons.map(function (c) {
      return {
        cle: 'flacon-' + c.id, nom: 'Flacon « ' + c.nom + ' »', hex: c.hex,
        lien: FLACONS + '?variant=' + c.variante
      };
    })).concat(inv.pinceaux
      ? [{ cle: 'pinceaux', nom: PINCEAUX.nom, lien: PINCEAUX.lien, icone: PINCEAUX.icone }]
      : []);
  }

  /* Les icônes de la liste en images pour le PDF, une fois pour toutes :
     { nom: toile }. Dessinées à 160 px pour 4,5 mm, soit environ 900 points
     par pouce : nettes à l'impression. */
  function imagesIcones(liste) {
    var noms = [];
    liste.forEach(function (a) { if (a.icone && noms.indexOf(a.icone) < 0) noms.push(a.icone); });
    return Promise.all(noms.map(function (nom) {
      return chargerImage('data:image/svg+xml;charset=utf-8,' +
                          encodeURIComponent(iconeSvg(nom, '#7B3FD3')))
        .then(function (img) {
          var c = document.createElement('canvas');
          c.width = c.height = 160;
          c.getContext('2d').drawImage(img, 0, 0, 160, 160);
          return [nom, c];
        }, function () { return [nom, null]; });
    })).then(function (paires) {
      var r = {};
      paires.forEach(function (p) { if (p[1]) r[p[0]] = p[1]; });
      return r;
    });
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

  /* Ce qu'il faut mettre au panier pour refaire ce maquillage, selon la règle
     écrite au-dessus de BOUTIQUE dans donnees.js :
       { kits: ['A'], coffrets: ['noel'], planches: ['papillon'],
         flacons: ['rouge', ...], pinceaux: true }
     Chaque liste dans l'ordre de sa source (KITS, COFFRETS, POCHOIRS, la
     palette). `pinceaux` dit si le duo vendu seul s'y ajoute.

     Le catalogue est petit : on essaie toutes les façons de prendre ou non
     chaque kit et chaque coffret (5 offres, 32 essais), on complète chacune
     avec des flacons, la planche Papillon et les pinceaux s'il en manque, et
     on garde la moins chère. */
  function panierDe(dessin) {
    var visibles = dessin.elements.filter(Rendu.resteVisible);

    // Ce que le maquillage emploie : ses couleurs, ses planches.
    var couleurs = [], planches = [];
    visibles.forEach(function (el) {
      if (el.couleurId && couleurDe(el.couleurId) && couleurs.indexOf(el.couleurId) < 0) {
        couleurs.push(el.couleurId);
      }
      if (el.type === 'forme' && planches.indexOf(el.setId) < 0) planches.push(el.setId);
    });
    var vide = { kits: [], coffrets: [], planches: [], flacons: [], pinceaux: false };
    if (!couleurs.length && !planches.length) return vide;

    // Les offres groupées, toutes décrites pareil. Les prix en centimes :
    // additionner des euros à virgule donne des 54,900000001.
    function centimes(p) { return Math.round((p || 0) * 100); }
    var offres = KITS.map(function (k) {
      return {
        sorte: 'kits', id: k.id, prix: centimes(k.prix),
        couleurs: COULEURS.filter(function (c) { return (c.kits || []).indexOf(k.id) >= 0; })
                          .map(function (c) { return c.id; }),
        planches: POCHOIRS.filter(function (s) { return s.kit === k.id; })
                          .map(function (s) { return s.id; })
      };
    }).concat(COFFRETS.map(function (c) {
      return { sorte: 'coffrets', id: c.id, prix: centimes(c.prix),
               couleurs: c.couleurs, planches: c.planches };
    }));

    // Toutes les façons de réunir le matériel, chacune avec son prix et ce
    // qu'elle donne (nombre de couleurs, planches et pinceaux).
    var paniers = [];
    for (var masque = 0; masque < (1 << offres.length); masque++) {
      var prises = offres.filter(function (o, i) { return masque & (1 << i); });
      var aCouleurs = {}, aPlanches = {}, donne = 0, prix = 0;
      prises.forEach(function (o) {
        prix += o.prix;
        o.couleurs.forEach(function (id) { aCouleurs[id] = true; });
        o.planches.forEach(function (id) { aPlanches[id] = true; });
      });
      // Une couleur apportée deux fois ne compte qu'une ; chaque kit ou
      // coffret compte en plus pour ses pinceaux et son tuto.
      donne = Object.keys(aCouleurs).length + Object.keys(aPlanches).length + prises.length;

      // Une planche posée que rien n'apporte vient seule.
      var seules = [];
      planches.forEach(function (id) {
        if (aPlanches[id]) return;
        var s = null;
        for (var i = 0; i < POCHOIRS.length; i++) if (POCHOIRS[i].id === id) s = POCHOIRS[i];
        if (s && s.variante) { seules.push(id); prix += centimes(s.prix); donne += 1; }
      });

      var flacons = couleurs.filter(function (id) { return !aCouleurs[id]; });
      flacons.forEach(function (id) {
        var c = couleurDe(id);
        prix += centimes(c.nacre ? BOUTIQUE.flacon.nacre : BOUTIQUE.flacon.mat);
        donne += 1;
      });

      var pinceaux = !prises.length;
      if (pinceaux) { prix += centimes(PINCEAUX.prix); donne += 1; }

      paniers.push({ prix: prix, donne: donne, prises: prises, seules: seules,
                     flacons: flacons, pinceaux: pinceaux });
    }

    // Le moins cher, à la tolérance près : parmi les paniers qui coûtent au
    // plus `tolerance` de plus que le moins cher, celui qui donne le plus
    // (un kit plutôt que ses morceaux) ; à égalité, le moins cher.
    var plusBas = Math.min.apply(null, paniers.map(function (p) { return p.prix; }));
    var plafond = plusBas + centimes(BOUTIQUE.tolerance);
    var meilleur = null;
    paniers.forEach(function (p) {
      if (p.prix > plafond) return;
      if (!meilleur || p.donne > meilleur.donne ||
          (p.donne === meilleur.donne && p.prix < meilleur.prix)) meilleur = p;
    });
    if (!meilleur) return vide;

    function ids(sorte) {
      return meilleur.prises.filter(function (o) { return o.sorte === sorte; })
                            .map(function (o) { return o.id; });
    }
    return {
      kits: ids('kits'),
      coffrets: ids('coffrets'),
      planches: POCHOIRS.filter(function (s) { return meilleur.seules.indexOf(s.id) >= 0; })
                        .map(function (s) { return s.id; }),
      flacons: COULEURS.filter(function (c) { return meilleur.flacons.indexOf(c.id) >= 0; })
                       .map(function (c) { return c.id; }),
      pinceaux: meilleur.pinceaux
    };
  }

  /* L'adresse que porte le QR code : la page relais, les kits et les
     flacons, par leurs noms courts. Elle reste courte exprès — un code court
     a de gros carrés, qui se lisent bien même sortis d'une imprimante
     fatiguée. */
  function adresseQr(dessin) {
    var p = panierDe(dessin);
    var morceaux = [];
    if (p.kits.length) morceaux.push('kits=' + p.kits.join(','));
    if (p.coffrets.length) morceaux.push('coffrets=' + p.coffrets.join(','));
    if (p.planches.length) morceaux.push('planches=' + p.planches.join(','));
    if (p.flacons.length) morceaux.push('flacons=' + p.flacons.join(','));
    if (p.pinceaux) morceaux.push('pinceaux=1');
    return BOUTIQUE.relais + (morceaux.length ? '?' + morceaux.join('&') : '');
  }

  /* Le QR code tracé en carrés vectoriels, net à toutes les tailles
     d'impression. Niveau de correction « M » : le code se lit encore s'il est
     un peu abîmé ou taché. */
  function dessinerQr(doc, texte, x, y, cote) {
    var qr = qrcode(0, 'M');
    qr.addData(texte);
    qr.make();
    var n = qr.getModuleCount();
    /* Une marge blanche de deux modules autour : sans elle, le téléphone
       confond le bord du code avec le fond lilas du bloc. */
    var m = cote / (n + 4);

    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, cote, cote, 'F');
    doc.setFillColor(0, 0, 0);
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) doc.rect(x + (c + 2) * m, y + (r + 2) * m, m, m, 'F');
      }
    }
  }

  /* Bloc d'appel du bas de page : le QR code à gauche, l'invitation à droite.
     Renvoie la hauteur occupée. */
  function appel(doc, y, dessin) {
    var largeur = PAGE_L - 2 * MARGE;
    var hauteur = QR_COTE + 12;

    doc.setFillColor(248, 243, 255);
    doc.setDrawColor(226, 213, 246);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGE, y, largeur, hauteur, 3, 3, 'FD');

    var qrX = MARGE + 6;
    var qrY = y + 6;

    var adresse = adresseQr(dessin);
    dessinerQr(doc, adresse, qrX, qrY, QR_COTE);
    /* Sur un écran, le code se touche aussi : la fiche ouverte sur le
       téléphone mène au même panier que la fiche imprimée. */
    doc.link(qrX, qrY, QR_COTE, QR_COTE, { url: adresse });

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

    return Promise.all([
      chargerImage('images/marque/logo-principal.png'),
      imagesIcones(achats(inv))
    ]).then(function (charges) {
      var logo = charges[0], icones = charges[1];
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

      /* La même liste d'achats que l'écran récap et que le QR code : une
         ligne par article, sur deux colonnes (la gauche d'abord). Une
         pastille de la vraie couleur devant un flacon, la petite icône
         violette devant le reste (un point si elle manque). Chaque nom est
         un lien vers sa page en boutique. */
      var liste = achats(inv);
      y += 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      if (!liste.length) {
        doc.setTextColor(140, 134, 148);
        doc.text('Aucun matériel utilisé.', MARGE, y + 3);
      }
      var parColonne = Math.ceil(liste.length / 2);
      liste.forEach(function (a, i) {
        var x = i < parColonne ? MARGE : PAGE_L / 2 + 2;
        var yc = y + 3 + (i % parColonne) * L_ACHAT;
        if (a.hex) {
          var rgb = hexVersRgb(a.hex);
          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.setDrawColor(200, 194, 208);
          doc.circle(x + 2, yc - 1.2, 2, 'FD');
        } else if (icones[a.icone]) {
          doc.addImage(icones[a.icone], 'PNG', x - 0.25, yc - 3.45, 4.5, 4.5,
                       'icone-' + a.icone);
        } else {
          doc.setFillColor(217, 72, 126);
          doc.circle(x + 2, yc - 1.2, 0.9, 'F');
        }
        doc.setTextColor(58, 52, 64);
        doc.textWithLink(a.nom, x + 6, yc, { url: a.lien });
      });

      // --- le bloc d'appel, calé juste au-dessus du pied de page
      /* Calé au-dessus du pied de page, à une place fixe : le dessin a déjà
         cédé ce qu'il fallait pour que la liste s'arrête avant. */
      appel(doc, basDeZone, dessin);

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

  /* LA PAGE DE LA BOUTIQUE TÉLÉCHARGE LA FICHE, PAS L'APPLI (08/11/2026).
     Dans le cadre de la boutique, un téléchargement lancé par l'appli fait
     dire à Safari (iPad, iPhone) : « Voulez-vous télécharger … sur
     labaguettemaquille.fr et laurynebaguet.github.io ? ». Le second nom
     inquiète. On confie donc le fichier à la page de la boutique (message
     `lbm-telecharger-fiche`), qui le télécharge elle-même : seul le nom de la
     boutique apparaît. Le code à ajouter à la page est dans
     outils/shopify-atelier-telechargement.html.

     La page accuse réception (`lbm-fiche-recue`). Sans réponse au bout de
     1,5 s — page pas encore modifiée, ou appli ouverte hors de la boutique —
     l'appli télécharge elle-même, comme avant : on ne reste jamais sans
     fiche. */
  var ATTENTE_PAGE = 1500;

  function confierALaPage(octets, nomFichier) {
    return new Promise(function (resolve) {
      var fini = false;
      function ecoute(ev) {
        if (BOUTIQUE.origines.indexOf(ev.origin) < 0) return;
        if (!ev.data || ev.data.type !== 'lbm-fiche-recue') return;
        terminer(true);
      }
      function terminer(ok) {
        if (fini) return;
        fini = true;
        window.removeEventListener('message', ecoute);
        resolve(ok);
      }
      window.addEventListener('message', ecoute);
      BOUTIQUE.origines.forEach(function (o) {
        try {
          window.parent.postMessage(
            { type: 'lbm-telecharger-fiche', nom: nomFichier, pdf: octets }, o);
        } catch (e) { /* adresse qui n'est pas celle de la page : ignorée */ }
      });
      setTimeout(function () { terminer(false); }, ATTENTE_PAGE);
    });
  }

  function generer(visage, image, dessin, nom) {
    return construire(visage, image, dessin, nom).then(function (doc) {
      var nomFichier = 'maquillage-' + limace(nom || visage.nom) + '.pdf';
      if (!Inscription.dansUnCadre()) { doc.save(nomFichier); return true; }
      return confierALaPage(doc.output('arraybuffer'), nomFichier)
        .then(function (pris) {
          if (!pris) doc.save(nomFichier);
          return true;
        });
    });
  }

  return {
    generer: generer, construire: construire, inventaire: inventaire,
    rendre: rendre, chargerImage: chargerImage, limace: limace,
    panierDe: panierDe, adresseQr: adresseQr, achats: achats,
    titrePour: titrePour
  };
})();
