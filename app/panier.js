/* Les adresses du panier Shopify. Deux usages :

   - la page relais du QR code (panier.html). Le QR code imprimé sur la fiche
     mène là, avec le matériel du maquillage :
     panier.html?kits=A&flacons=rouge,blanc. La page fabrique alors l'adresse
     du panier AVEC LES RÉGLAGES DU JOUR (BOUTIQUE, dans donnees.js) et y
     envoie aussitôt. Une fiche imprimée en octobre suit donc les réglages de
     novembre : plus de précommande quand elle s'arrête, nouveaux numéros si
     un produit est recréé ;
   - le bouton de précommande du récapitulatif, dans l'appli.

   Dans les deux cas, chaque article porte le plan de précommande : sans lui,
   la cliente serait débitée tout de suite. Pas de format court
   /cart/<variante>:<quantité>, qui ne sait pas le porter. */
var Panier = (function () {
  'use strict';

  /* Les numéros Shopify des kits et des flacons demandés, par leurs noms
     courts : { kits: ['A'], flacons: ['rouge'] }. Un nom inconnu est
     ignoré. */
  function variantes(demande) {
    function de(liste, ids) {
      return liste.filter(function (x) {
        return (ids || []).indexOf(x.id) >= 0 && x.variante;
      }).map(function (x) { return x.variante; });
    }
    return de(KITS, demande.kits).concat(de(COULEURS, demande.flacons));
  }

  /* L'ajout au panier, puis la page panier, où la cliente voit la remise et
     la mention de précommande. */
  function ajout(numeros) {
    return '/cart/add?' + numeros.map(function (id) {
      return 'items[][id]=' + id + '&items[][quantity]=1' +
             (BOUTIQUE.precommande ? '&items[][selling_plan]=' + BOUTIQUE.precommande : '');
    }).join('&') + '&return_to=/cart';
  }

  /* Pour le QR code : on VIDE d'abord le panier. Le téléphone qui scanne doit
     arriver sur exactement le matériel de la fiche.
     Si rien n'est reconnu, on ouvre simplement la boutique. */
  function adresse(demande) {
    var v = variantes(demande);
    if (!v.length) return BOUTIQUE.adresse;
    return BOUTIQUE.adresse + '/cart/clear?return_to=' + encodeURIComponent(ajout(v));
  }

  /* Pour le bouton de l'appli : on AJOUTE au panier sans le vider. Un panier
     commencé ailleurs sur la boutique ne doit pas disparaître. */
  function adresseAjout(demande) {
    var v = variantes(demande);
    return v.length ? BOUTIQUE.adresse + ajout(v) : BOUTIQUE.adresse;
  }

  function demandeDansAdresse() {
    var q = new URLSearchParams(window.location.search);
    function liste(nom) { return (q.get(nom) || '').split(',').filter(Boolean); }
    return { kits: liste('kits'), flacons: liste('flacons') };
  }

  return { adresse: adresse, adresseAjout: adresseAjout, demandeDansAdresse: demandeDansAdresse };
})();
