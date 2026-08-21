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

    var histoAvant = useRef(null);
    var dessin = histoire.present;
    var visage = visagePar(visageId);

    /* -------------------------------------------------- initialisation */

    useEffect(function () {
      Formes.init();
      var sets = Formes.sets();
      if (sets.length && sets[0].formes.length) setFormeChoisie(sets[0].formes[0]);

      var sauve = Modele.charger();
      if (sauve) {
        setHistoire(Modele.histoNeuf(sauve.dessin));
        if (sauve.visageId) setVisageId(sauve.visageId);
        setTelecharge(sauve.telecharge !== false);
      }

      Promise.all(VISAGES.map(function (v) {
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
      Modele.enregistrer({ visageId: visageId, telecharge: telecharge, dessin: dessin });
    }, [dessin, visageId, telecharge]);

    /* ------------------------------- rappel avant de quitter la page */

    var aDuTravail = dessin.elements.length > 0;
    useEffect(function () {
      if (!aDuTravail || telecharge) return;
      function avant(ev) { ev.preventDefault(); ev.returnValue = ''; return ''; }
      window.addEventListener('beforeunload', avant);
      return function () { window.removeEventListener('beforeunload', avant); };
    }, [aDuTravail, telecharge]);

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
          setSelectionId(null);
        }
      }
      window.addEventListener('keydown', touche);
      return function () { window.removeEventListener('keydown', touche); };
    }, [selectionId, supprimer]);

    function telecharger() {
      if (fabrique) return;
      setFabrique(true);
      Fiche.generer(visage, images[visageId], dessin)
        .then(function () { setTelecharge(true); setDialogue(null); })
        .catch(function (err) {
          window.alert("La fiche n'a pas pu être créée : " + err.message);
        })
        .then(function () { setFabrique(false); });
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
        <${UI.Galerie} visageId=${visageId} enCours=${aDuTravail} onChoisir=${choisirVisage}/>`;
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
          <span class="titre-mini">${visage.nom}</span>
          <span class="espace"></span>
          <button class="icone-btn" title="Annuler" disabled=${!Modele.peutAnnuler(histoire)}
                  onClick=${function () { pasHistoire('annuler'); }}>
            <${UI.Icone} nom="annuler"/>
          </button>
          <button class="icone-btn" title="Rétablir" disabled=${!Modele.peutRefaire(histoire)}
                  onClick=${function () { pasHistoire('refaire'); }}>
            <${UI.Icone} nom="refaire"/>
          </button>
          <button class="btn btn-primaire btn-petit"
                  onClick=${function () { setDialogue('recap'); }}>
            <${UI.Icone} nom="telecharger"/> Ma fiche
          </button>
        </div>

        <div class="corps">
          ${pret && images[visageId]
            ? html`
              <${Toile}
                visage=${visage}
                image=${images[visageId]}
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
                    <div class="rappel">
                      <span>N'oublie pas ta fiche</span>
                      <button onClick=${function () { setDialogue('recap'); }}>La récupérer</button>
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
            aDuTravail=${aDuTravail}
            onToutEffacer=${function () { setDialogue('effacer'); }}/>
        </div>

        ${dialogue === 'effacer'
          ? html`
            <${UI.Dialogue}
              titre="Tout effacer ?"
              texte="Tout le maquillage sera retiré, et tu repartiras d'un visage nu."
              onFermer=${function () { setDialogue(null); }}
              actions=${html`
                <button class="btn btn-fantome" onClick=${function () { setDialogue(null); }}>Annuler</button>
                <button class="btn btn-rose" onClick=${toutEffacer}>Tout effacer</button>`}/>`
          : null}

        ${dialogue === 'recap'
          ? html`
            <${UI.Dialogue}
              titre="Ta fiche à imprimer"
              texte="Elle contient ton maquillage en grand, et la liste de ce qu'il te faut pour le réaliser pour de vrai."
              enfants=${html`<${UI.Recap} inventaire=${inv}/>`}
              onFermer=${function () { setDialogue(null); }}
              actions=${html`
                <button class="btn btn-fantome" onClick=${function () { setDialogue(null); }}>Plus tard</button>
                <button class="btn btn-primaire" disabled=${fabrique} onClick=${telecharger}>
                  ${fabrique ? 'Préparation…' : 'Télécharger la fiche'}
                </button>`}/>`
          : null}
      </div>`;
  }

  ReactDOM.createRoot(document.getElementById('racine')).render(React.createElement(App));
})();
