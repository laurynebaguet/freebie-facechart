/* Composant racine : il tient l'état de toute l'application.

   Il n'y a qu'UN dessin, partagé par tous les visages : changer d'enfant
   montre le même maquillage sur une autre tête. */
(function () {
  'use strict';
  var html = htm.bind(React.createElement);
  var useState = React.useState, useEffect = React.useEffect,
      useRef = React.useRef, useCallback = React.useCallback;

  function visagePar(id) {
    for (var i = 0; i < VISAGES.length; i++) if (VISAGES[i].id === id) return VISAGES[i];
    return VISAGES[0];
  }

  function couleurHex(id) {
    for (var i = 0; i < COULEURS.length; i++) if (COULEURS[i].id === id) return COULEURS[i].hex;
    return '#000';
  }

  function peauHex(id) {
    for (var i = 0; i < PEAUX.length; i++) if (PEAUX[i].id === id) return PEAUX[i].hex;
    return PEAUX[0].hex;
  }

  function App() {
    var e1 = useState('accueil'), ecran = e1[0], setEcran = e1[1];
    var e2 = useState(VISAGES[0].id), visageId = e2[0], setVisageId = e2[1];
    var e3 = useState(Modele.histoNeuf()), histoire = e3[0], setHistoire = e3[1];
    var e4 = useState('pochoir'), outil = e4[0], setOutil = e4[1];
    var e5 = useState(COULEURS[0].id), couleurId = e5[0], setCouleurId = e5[1];
    var e6 = useState(null), formeChoisie = e6[0], setFormeChoisie = e6[1];
    var e7 = useState(4), taillePinceau = e7[0], setTaillePinceau = e7[1];
    var e8 = useState(10), tailleGomme = e8[0], setTailleGomme = e8[1];
    var e9 = useState(null), selectionId = e9[0], setSelectionId = e9[1];
    var e10 = useState({}), images = e10[0], setImages = e10[1];
    var e11 = useState(true), telecharge = e11[0], setTelecharge = e11[1];
    var e12 = useState(null), dialogue = e12[0], setDialogue = e12[1];
    var e13 = useState(false), pret = e13[0], setPret = e13[1];
    var e14 = useState(false), fabrique = e14[0], setFabrique = e14[1];
    var e15 = useState(3), echelle = e15[0], setEchelle = e15[1];
    /* Les prénoms que la personne a donnés aux visages, par identifiant. */
    var e16 = useState({}), noms = e16[0], setNoms = e16[1];
    var e17 = useState(false), envoie = e17[0], setEnvoie = e17[1];
    /* La teinte de la toile vierge. Elle ne concerne qu'elle : les visages
       dessinés gardent la leur. */
    var e18 = useState(PEAUX[0].id), peauId = e18[0], setPeauId = e18[1];

    var histoAvant = useRef(null);
    var dessin = histoire.present;
    var visage = visagePar(visageId);

    /* Sur quoi le maquillage se pose : le dessin du visage, ou — pour la toile
       vierge, qui n’a pas de fichier — la couleur choisie, écrite en toutes
       lettres. Rendu.fond sait recevoir les deux. */
    var support = visage.peau ? peauHex(peauId) : images[visageId];

    /* -------------------------------------------------- initialisation */

    useEffect(function () {
      Formes.init();
      /* Logo et polices chargés d'avance : le partage se fabrique ensuite sans
         la moindre attente, seule façon pour le téléphone d'accepter d'ouvrir
         sa fenêtre de partage (voir app/partage.js). */
      Partage.prechauffer();
      var sets = Formes.sets();
      if (sets.length && sets[0].formes.length) setFormeChoisie(sets[0].formes[0]);

      var sauve = Modele.charger();
      if (sauve) {
        setHistoire(Modele.histoNeuf(sauve.dessin));
        if (sauve.visageId) setVisageId(sauve.visageId);
        if (sauve.noms) setNoms(sauve.noms);
        if (sauve.peauId) setPeauId(sauve.peauId);
        setTelecharge(sauve.telecharge !== false);
      }

      /* La toile vierge n'a pas de fichier à charger : elle se peint. */
      Promise.all(VISAGES.filter(function (v) { return v.image; }).map(function (v) {
        return Fiche.chargerImage(v.image).then(function (img) { return [v.id, img]; });
      })).then(function (paires) {
        var m = {};
        paires.forEach(function (pr) { m[pr[0]] = pr[1]; });
        setImages(m);
        setPret(true);
      });
    }, []);

    /* ------------------------------------------------------ sauvegarde */

    useEffect(function () {
      Modele.enregistrer({
        visageId: visageId, telecharge: telecharge, noms: noms,
        peauId: peauId, dessin: dessin
      });
    }, [dessin, visageId, telecharge, noms, peauId]);

    var aDuTravail = dessin.elements.length > 0;

    /* PAS d'avertissement avant de quitter la page. Il y en avait un, il a été
       retiré le 06/09/2026 : le maquillage est enregistré dans le navigateur à
       chaque geste et revient tout seul à la visite suivante, donc la question
       « voulez-vous vraiment quitter ? » ne protégeait plus rien. Elle ne
       faisait qu'ajouter une fenêtre grise, que le navigateur écrit dans sa
       propre langue et qu'on ne peut ni habiller ni traduire.

       Le rappel « N'oublie pas ta fiche » reste, lui : il ne bloque personne
       et rend un vrai service. */

    /* ------------------------------------------------- modifications */

    var appliquer = useCallback(function (fn, phase) {
      setTelecharge(false);
      setHistoire(function (h) {
        var suivant = fn ? fn(h.present) : h.present;
        if (phase === 'debut') {
          histoAvant.current = h;
          return { passe: h.passe, present: suivant, futur: h.futur };
        }
        if (phase === 'cours') {
          return { passe: h.passe, present: suivant, futur: h.futur };
        }
        /* Geste abandonné : on revient à l'état d'avant, sans laisser de trace
           dans l'historique. Sert quand un second doigt se pose pour zoomer,
           alors que le premier venait de commencer à tamponner.

           On défait le geste en partant de l'état COURANT, `fn` retirant le
           motif par son identifiant, plutôt qu'en restaurant l'instantané pris
           au début : quand les deux doigts se posent dans le même instant, cet
           instantané n'est pas encore en place et le repli manquait sa cible.
           Rien n'a été poussé dans le passé entre-temps, donc l'historique
           reste intact. */
        if (phase === 'annule') {
          histoAvant.current = null;
          var etat = fn ? fn(h.present) : h.present;
          return { passe: h.passe, present: etat, futur: h.futur };
        }
        var base = histoAvant.current || h;
        histoAvant.current = null;
        return Modele.histoAppliquer(base, suivant);
      });
    }, []);

    function pasHistoire(sens) {
      setHistoire(function (h) {
        return sens === 'annuler' ? Modele.annuler(h) : Modele.refaire(h);
      });
      setSelectionId(null);
    }

    function toutEffacer() {
      appliquer(function () { return Modele.vide(); }, 'fin');
      setSelectionId(null);
      setDialogue(null);
    }

    var supprimer = useCallback(function (id) {
      if (id == null) return;
      setSelectionId(null);
      appliquer(function (d) { return Modele.supprimer(d, id); }, 'fin');
    }, [appliquer]);

    var retourner = useCallback(function (id) {
      if (id == null) return;
      appliquer(function (d) {
        var el = Modele.trouver(d, id);
        return el ? Modele.modifier(d, id, { miroir: !el.miroir }) : d;
      }, 'fin');
    }, [appliquer]);

    /* La palette sert aussi à repeindre la forme sélectionnée. */
    function choisirCouleur(cid) {
      setCouleurId(cid);
      if (selectionId == null) return;
      var id = selectionId;
      appliquer(function (d) { return Modele.modifier(d, id, { couleurId: cid }); }, 'fin');
    }

    function choisirVisage(id) {
      setVisageId(id);
      setSelectionId(null);
      setEcran('atelier');
    }

    /* Rebaptiser un visage. Ça ne touche pas au dessin, donc ça ne passe pas
       par l'historique : annuler ne défait pas un prénom. */
    function renommerVisage(id, texte) {
      setNoms(function (n) { return Modele.renommer(n, id, texte); });
    }

    function choisirOutil(id) {
      setOutil(id);
      if (id !== 'modifier') setSelectionId(null);
    }

    function choisirForme(f) {
      setFormeChoisie(f);
      setOutil('pochoir');
      setSelectionId(null);
    }

    /* Supprimer au clavier la forme sélectionnée. */
    useEffect(function () {
      function touche(ev) {
        var cible = ev.target;
        if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return;
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
          if (selectionId == null) return;
          ev.preventDefault();
          supprimer(selectionId);
        } else if (ev.key === 'Escape') {
          /* Échap ramène à la main : depuis un outil qui dessine on bascule
             sur Modifier, et si on y est déjà on lâche la forme choisie. */
          ev.preventDefault();
          setOutil(function (courant) {
            if (courant !== 'modifier') return 'modifier';
            setSelectionId(null);
            return courant;
          });
        }
      }
      window.addEventListener('keydown', touche);
      return function () { window.removeEventListener('keydown', touche); };
    }, [selectionId, supprimer]);

    function telecharger() {
      if (fabrique) return;
      setFabrique(true);
      Fiche.generer(visage, support, dessin, Modele.nom(noms, visage))
        .then(function () { setTelecharge(true); setDialogue(null); })
        .catch(function (err) {
          window.alert("La fiche n'a pas pu être créée : " + err.message);
        })
        .then(function () { setFabrique(false); });
    }

    /* Rien n'est attendu avant l'appel : tout le travail est synchrone, sans
       quoi le téléphone refuserait d'ouvrir sa fenêtre de partage. */
    function partagerImage() {
      if (envoie) return;
      setEnvoie(true);
      var fini = function () { setEnvoie(false); };
      try {
        Partage.envoyer(visage, support, dessin, Modele.nom(noms, visage))
          .then(function (issue) { if (issue !== 'annule') setDialogue(null); })
          .catch(function (err) {
            window.alert("L'image n'a pas pu être créée : " + err.message);
          })
          .then(fini);
      } catch (err) {
        window.alert("L'image n'a pas pu être créée : " + err.message);
        fini();
      }
    }

    var majEchelle = useCallback(function (e) {
      setEchelle(function (ancienne) {
        return Math.abs(ancienne - e) > 0.01 ? e : ancienne;
      });
    }, []);

    /* ------------------------------------------------------- affichage */

    if (ecran === 'accueil') {
      return html`<${UI.Accueil} onDemarrer=${function () { setEcran('galerie'); }}/>`;
    }

    if (ecran === 'galerie') {
      return html`
        <${UI.Galerie} visageId=${visageId} noms=${noms}
                       peauId=${peauId} onPeau=${setPeauId}
                       onChoisir=${choisirVisage} onRenommer=${renommerVisage}/>`;
    }

    var selection = selectionId != null ? Modele.trouver(dessin, selectionId) : null;
    var inv = Fiche.inventaire(dessin);

    return html`
      <div class="atelier">
        <div class="entete">
          <button class="icone-btn" title="Changer de visage"
                  onClick=${function () { setEcran('galerie'); }}>
            <${UI.Icone} nom="visages"/>
          </button>
          <span class="titre-mini">${Modele.nom(noms, visage)}</span>
          <span class="espace"></span>
          ${/* Les deux flèches vont ensemble : elles font le même travail, dans
                les deux sens. On les serre l'une contre l'autre et on les
                écarte du bouton de la fiche, sans quoi la seconde semble
                appartenir à celui-ci. */''}
          <span class="histoire">
            <button class="icone-btn" title="Annuler" disabled=${!Modele.peutAnnuler(histoire)}
                    onClick=${function () { pasHistoire('annuler'); }}>
              <${UI.Icone} nom="annuler"/>
            </button>
            <button class="icone-btn" title="Rétablir" disabled=${!Modele.peutRefaire(histoire)}
                    onClick=${function () { pasHistoire('refaire'); }}>
              <${UI.Icone} nom="refaire"/>
            </button>
          </span>
          ${/* Sans icône : elle était invisible faute de taille, et son écart
                poussait le texte à droite du milieu. Le libellé se suffit. */''}
          <button class="btn btn-primaire btn-petit fiche"
                  onClick=${function () { setDialogue('recap'); }}>
            Ma fiche récap
          </button>
        </div>

        <div class="corps">
          ${pret && support
            ? html`
              <${Toile}
                visage=${visage}
                image=${support}
                dessin=${dessin}
                outil=${outil}
                couleurId=${couleurId}
                taillePinceau=${taillePinceau}
                tailleGomme=${tailleGomme}
                formeChoisie=${formeChoisie}
                selectionId=${selectionId}
                appliquer=${appliquer}
                onSelection=${setSelectionId}
                onSupprimer=${supprimer}
                onMiroir=${retourner}
                onOutil=${setOutil}
                onEchelle=${majEchelle}
                enfants=${!telecharge && dessin.elements.length >= 5
                  ? html`
                    ${/* Le lien est sur le mot « fiche » lui-même : une phrase
                          courte suivie d'un « La récupérer » disait deux fois
                          la même chose, et le rappel n'a pas de place à
                          gaspiller au-dessus du dessin. */''}
                    <div class="rappel">
                      N'oublie pas ta ${' '}
                      <button onClick=${function () { setDialogue('recap'); }}>fiche</button>
                    </div>`
                  : null}/>`
            : html`<div class="scene"><p class="aide">Chargement…</p></div>`}

          <${UI.BarreOutils}
            outil=${outil}
            onOutil=${choisirOutil}
            couleurId=${couleurId}
            couleurHex=${couleurHex(couleurId)}
            onCouleur=${choisirCouleur}
            formeChoisie=${formeChoisie}
            onForme=${choisirForme}
            taillePinceau=${taillePinceau}
            onTaillePinceau=${setTaillePinceau}
            tailleGomme=${tailleGomme}
            onTailleGomme=${setTailleGomme}
            echelle=${echelle}
            selection=${selection}
            onMiroir=${function () { retourner(selectionId); }}
            onSupprimer=${function () { supprimer(selectionId); }}
            aDuTravail=${aDuTravail}
            onToutEffacer=${function () { setDialogue('effacer'); }}/>
        </div>

        ${dialogue === 'effacer'
          ? html`
            <${UI.Dialogue}
              titre="Tout effacer ?"
              etroite=${true}
              ${/* « visage nu » est soudé par une espace insécable : même si la
                    boîte changeait de largeur un jour, le « nu » ne se
                    retrouverait pas seul en tête de ligne. */''}
              texte="Tout le maquillage sera retiré, et tu repartiras d'un visage nu."
              onFermer=${function () { setDialogue(null); }}
              actions=${html`
                <button class="btn btn-fantome" onClick=${function () { setDialogue(null); }}>Annuler</button>
                <button class="btn btn-rose" onClick=${toutEffacer}>Tout effacer</button>`}/>`
          : null}

        ${dialogue === 'recap'
          ? html`
            <${UI.Dialogue}
              titre="Ta fiche à imprimer"
              texte=${"Elle contient ton maquillage en grand, et la liste de ce qu'il te faut " +
                      "pour le réaliser pour de vrai. Tu peux aussi enregistrer l'image pour la " +
                      "partager sur tes réseaux. N'oublie pas de nous taguer, ça nous fera " +
                      "super plaisir de voir ton œuvre !"}
              enfants=${html`<${UI.Recap} inventaire=${inv}/>`}
              onFermer=${function () { setDialogue(null); }}
              actions=${html`
                <button class="btn btn-fantome" onClick=${function () { setDialogue(null); }}>Plus tard</button>
                <button class="btn btn-secondaire" disabled=${envoie || !aDuTravail}
                        onClick=${partagerImage}>
                  ${envoie ? 'Un instant…' : (Partage.peutPartager() ? "Partager l'image" : "Enregistrer l'image")}
                </button>
                <button class="btn btn-primaire" disabled=${fabrique} onClick=${telecharger}>
                  ${fabrique ? 'Préparation…' : 'Télécharger la fiche'}
                </button>`}/>`
          : null}
      </div>`;
  }

  ReactDOM.createRoot(document.getElementById('racine')).render(React.createElement(App));
})();
