/* L'adresse mail donnée en échange de la fiche (choisi le 23/10/2026, revu
   le 05/11/2026).

   L'appli ne demande PAS l'adresse elle-même. Une première version le
   faisait, puis la confiait à la page de la boutique, qui l'inscrivait en
   coulisse : Shopify a refusé (« Missing CAPTCHA token »), parce que sa
   protection anti-robots veut une vraie personne devant un vrai formulaire.
   On garde cette protection.

   Donc :
   1. l'appli demande à la page Shopify « Le petit atelier magique », qui
      l'affiche dans son cadre, d'ouvrir SA fenêtre d'inscription
      (message `lbm-demande-inscription`) ;
   2. la personne s'inscrit dans cette fenêtre (étiquettes `newsletter`,
      `source-atelier`). La page se recharge alors, et l'appli avec elle :
      le dessin, lui, est gardé dans le navigateur (app/modele.js) ;
   3. juste après, la page envoie plusieurs fois `lbm-inscription-ok`.
      L'appli le note (clé `lbm-freebie-inscrite`) et prévient l'écran, UNE
      seule fois, qui propose alors de télécharger la fiche.

   Les messages ne partent et ne sont acceptés que vers et depuis les
   adresses de la boutique listées dans `BOUTIQUE.origines` (donnees.js).
   Ouverte directement, hors de la boutique, l'appli n'a personne à qui
   demander : la fiche se télécharge sans inscription. */
var Inscription = (function () {
  'use strict';

  /* Rangé à part du dessin : « Tout effacer » ne doit pas redemander
     l'inscription. On ne garde que le fait d'être inscrite, pas l'adresse. */
  var CLE = 'lbm-freebie-inscrite';

  var recue = false;      // l'accord de la boutique est arrivé
  var annoncee = false;   // et l'écran en a été prévenu
  var ecoute = null;

  function faite() {
    try { return window.localStorage.getItem(CLE) === 'oui'; }
    catch (e) { return false; }
  }

  /* L'appli est-elle affichée dans le cadre d'une autre page ? */
  function dansUnCadre() {
    try { return window.parent && window.parent !== window; }
    catch (e) { return true; }
  }

  function demander() {
    if (!dansUnCadre()) return;
    /* Un envoi vers une adresse qui n'est pas celle de la page parente est
       simplement ignoré par le navigateur : on peut donc tenter chacune. */
    BOUTIQUE.origines.forEach(function (o) {
      try { window.parent.postMessage({ type: 'lbm-demande-inscription' }, o); }
      catch (e) { /* ignorée */ }
    });
  }

  function annoncer() {
    if (recue && !annoncee && ecoute) {
      annoncee = true;
      ecoute();
    }
  }

  /* L'écran s'abonne ici. Si l'accord est arrivé avant lui (le message peut
     précéder l'affichage), il est prévenu dès qu'il s'abonne. */
  function quandInscrite(fn) {
    ecoute = fn;
    annoncer();
    return function () { if (ecoute === fn) ecoute = null; };
  }

  /* À l'écoute dès le chargement du fichier, sans attendre l'écran : la page
     envoie son accord juste après s'être rechargée. Elle le répète dix
     fois ; seule la première compte. */
  window.addEventListener('message', function (ev) {
    if (BOUTIQUE.origines.indexOf(ev.origin) < 0) return;
    if (!ev.data || ev.data.type !== 'lbm-inscription-ok') return;
    try { window.localStorage.setItem(CLE, 'oui'); } catch (e) { /* tant pis */ }
    recue = true;
    annoncer();
  });

  return {
    faite: faite, dansUnCadre: dansUnCadre,
    demander: demander, quandInscrite: quandInscrite
  };
})();
