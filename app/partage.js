/* L'image à montrer : le visage maquillé seul, au format des réseaux.

   C'est le second objet qui sort de l'application, à côté de la fiche à
   imprimer, et il a un autre métier. La fiche sert à maquiller pour de vrai ;
   l'image sert à montrer. D'où le format 4/5, celui qui occupe le plus de
   hauteur dans un fil Instagram.

   La marque est GRAVÉE DANS L'IMAGE, pas proposée en légende : aucun réseau ne
   reprend le texte qu'un site lui passe avec une image. Seule l'image voyage,
   donc c'est elle qui doit porter le logo et l'adresse.

   Aucun site web ne peut publier sur Instagram — ça n'existe pas. Le mieux
   possible, c'est la fenêtre de partage du téléphone, d'où l'on choisit
   Instagram en un geste. Sur ordinateur elle n'existe pas : on enregistre
   l'image, et la personne la reprend depuis son téléphone. */
var Partage = (function () {
  'use strict';

  var L = 1080, H = 1350;   // 4/5
  var MARGE = 72;

  var logo = null;

  /* Le logo et les polices sont chargés d'avance, à l'ouverture de l'atelier.

     Ce n'est pas du confort : sur iPhone, la fenêtre de partage n'a le droit
     de s'ouvrir que pendant le geste de la personne. Un seul `await` glissé
     entre le doigt et l'appel, et le partage est refusé sans explication.
     Tout ce qui suit est donc fabriqué de façon synchrone, ce qui n'est
     possible que si le logo est déjà là. */
  function prechauffer() {
    var polices = (document.fonts && document.fonts.ready)
      ? document.fonts.ready : Promise.resolve();
    var img = logo
      ? Promise.resolve()
      : Fiche.chargerImage('images/marque/logo-principal.png')
          .then(function (i) { logo = i; });
    /* Sans logo ni police maison on dessine quand même : une image sans
       marque vaut mieux qu'un bouton qui ne répond pas. */
    return Promise.all([img, polices]).catch(function () {});
  }

  function coinsArrondis(x, gx, gy, l, h, r) {
    x.beginPath();
    x.moveTo(gx + r, gy);
    x.arcTo(gx + l, gy, gx + l, gy + h, r);
    x.arcTo(gx + l, gy + h, gx, gy + h, r);
    x.arcTo(gx, gy + h, gx, gy, r);
    x.arcTo(gx, gy, gx + l, gy, r);
    x.closePath();
  }

  /* Réduit la taille de la police jusqu'à ce que le texte tienne : un prénom
     composé ne doit pas déborder du cadre. */
  function ajuster(x, texte, taille, largeurMax, police) {
    do {
      x.font = taille + 'px ' + police;
      if (x.measureText(texte).width <= largeurMax) break;
      taille -= 2;
    } while (taille > 22);
  }

  function dessiner(visage, image, dessin, nom) {
    var c = document.createElement('canvas');
    c.width = L; c.height = H;
    var x = c.getContext('2d');

    x.fillStyle = '#FFF8F0';
    x.fillRect(0, 0, L, H);

    // --- le prénom, en haut
    x.textAlign = 'center';
    x.fillStyle = '#7B3FD3';
    /* Dans la police des titres de la marque : c'est elle qu'on reconnaît en
       défilant un fil, bien avant de lire le logo. */
    var titre = Fiche.titrePour(nom);
    ajuster(x, titre, 62, L - 2 * MARGE, '"Luckiest Guy", Nunito, sans-serif');
    x.fillText(titre, L / 2, 116);

    // --- le visage
    var toile = Fiche.rendre(visage, image, dessin, 1000);
    var zoneY = 158, zoneH = 890, zoneL = L - 2 * MARGE;
    var k = Math.min(zoneL / toile.width, zoneH / toile.height);
    var l = Math.round(toile.width * k), h = Math.round(toile.height * k);
    var gx = Math.round((L - l) / 2), gy = Math.round(zoneY + (zoneH - h) / 2);

    x.fillStyle = '#FFFFFF';
    coinsArrondis(x, gx - 10, gy - 10, l + 20, h + 20, 24);
    x.fill();
    x.strokeStyle = '#E8DFD4';
    x.lineWidth = 2;
    x.stroke();
    x.drawImage(toile, gx, gy, l, h);

    /* Le compte, dans le cadre plutôt qu'en pied d'image : c'est là que l'œil
       est déjà posé, et une capture d'écran recadrée l'emporte avec elle. */
    x.textAlign = 'right';
    x.fillStyle = '#7B3FD3';
    x.font = '700 27px Nunito, "Segoe UI", sans-serif';
    x.fillText(TEXTES.instagram, gx + l - 22, gy + h - 22);
    x.textAlign = 'center';

    // --- le logo, en grand
    if (logo) {
      var logoL = 540;
      var logoH = logoL * (logo.naturalHeight / logo.naturalWidth);
      x.drawImage(logo, (L - logoL) / 2, H - 40 - logoH, logoL, logoH);
    }

    return c;
  }

  /* De l'image au fichier sans passer par `toBlob`, qui est asynchrone et
     ferait perdre le droit d'ouvrir la fenêtre de partage. */
  function versBlob(dataURL) {
    var binaire = atob(dataURL.slice(dataURL.indexOf(',') + 1));
    var octets = new Uint8Array(binaire.length);
    for (var i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return new Blob([octets], { type: 'image/png' });
  }

  function fichierPossible() {
    try { return new File([new Blob([''])], 'x.png', { type: 'image/png' }); }
    catch (e) { return null; }
  }

  /* Le téléphone sait-il ouvrir sa fenêtre de partage avec un fichier ?
     Sert à nommer le bouton : « Partager » ou « Enregistrer ». */
  function peutPartager() {
    var f = fichierPossible();
    return !!(f && navigator.share && navigator.canShare &&
              navigator.canShare({ files: [f] }));
  }

  function enregistrer(blob, nomFichier) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* Renvoie ce qui s'est réellement passé : 'partage', 'enregistre' ou
     'annule'. L'appelant en a besoin — refermer la fenêtre de partage n'est
     pas une panne, et ne doit pas déclencher de message d'erreur. */
  function envoyer(visage, image, dessin, nom) {
    var toile = dessiner(visage, image, dessin, nom);
    var blob = versBlob(toile.toDataURL('image/png'));
    var nomFichier = 'maquillage-' + Fiche.limace(nom || visage.nom) + '.png';

    var fichier;
    try { fichier = new File([blob], nomFichier, { type: 'image/png' }); }
    catch (e) { fichier = null; }

    if (fichier && navigator.share && navigator.canShare &&
        navigator.canShare({ files: [fichier] })) {
      return navigator.share({ files: [fichier] })
        .then(function () { return 'partage'; })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return 'annule';
          /* Refus le plus fréquent : un cadre intégré auquel la page d'accueil
             n'a pas donné l'autorisation `web-share`. L'enregistrement rend le
             même service, on ne laisse pas la personne sans rien. */
          enregistrer(blob, nomFichier);
          return 'enregistre';
        });
    }

    enregistrer(blob, nomFichier);
    return Promise.resolve('enregistre');
  }

  return {
    prechauffer: prechauffer, peutPartager: peutPartager,
    envoyer: envoyer, dessiner: dessiner
  };
})();
