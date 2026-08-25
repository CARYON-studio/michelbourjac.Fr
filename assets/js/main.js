/* Michel Bourjac — JS vanilla minimal
   1. Header collant  2. Révélations au scroll (DS)  3. Menu mobile  4. Accordéons */
(function () {
  "use strict";

  /* ── 1 · Header collant : surface translucide + blur une fois scrollé ── */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── 2 · Révélations au scroll — one-shot, système .reveal du DS.
     prefers-reduced-motion est géré côté CSS (état final immédiat). ── */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("in"); });
  }

  /* ── 3 · Menu mobile — disclosure accessible ── */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    /* Échap referme et rend le focus au bouton */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ── 4 · Accordéons — <details> natif (clavier + lecteurs d'écran d'origine),
     on synchronise aria-expanded sur le <summary> pour les AT qui l'attendent. ── */
  var accs = document.querySelectorAll(".acc");
  Array.prototype.forEach.call(accs, function (acc, i) {
    var sum = acc.querySelector("summary");
    var body = acc.querySelector(".acc-body");
    if (!sum || !body) return;

    if (!body.id) body.id = "acc-body-" + (i + 1);
    sum.setAttribute("aria-controls", body.id);
    sum.setAttribute("aria-expanded", acc.open ? "true" : "false");

    acc.addEventListener("toggle", function () {
      sum.setAttribute("aria-expanded", acc.open ? "true" : "false");
    });
  });

  /* Ouvrir l'accordéon ciblé par l'ancre (#psychanalyse, #tarifs…) */
  var openFromHash = function () {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (target && target.classList.contains("acc")) {
      target.open = true;
      target.scrollIntoView({ block: "start" });
      var s = target.querySelector("summary");
      if (s) s.focus();
    }
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ── 5 · Validation du formulaire — messages en TEXTE ──────────────
     La validation native affiche une bulle éphémère, non reliée au champ,
     que rien ne réannonce et qui disparaît au premier clic. RGAA 11.10 et
     WCAG 3.3.1/3.3.3 demandent un message persistant, textuel, qui nomme
     le champ et dit quoi faire.

     On ne pose `novalidate` qu'ici : si ce script ne s'exécute pas, le
     navigateur reprend la main et le formulaire reste utilisable.
     La couleur ne porte jamais l'information seule — texte + ⚠ + aria-invalid.
     Le résumé n'est pas une live-region : on y déplace le focus, ce qui l'annonce
     une fois et une seule (parti retenu par le GOV.UK Design System).
     ──────────────────────────────────────────────────────────────── */
  var form = document.querySelector(".form");
  if (form) {
    form.setAttribute("novalidate", "novalidate");

    var resume = document.getElementById("form-erreurs");
    var resumeListe = document.getElementById("form-erreurs-liste");

    /* Message dédié par champ : on dit ce qu'on attend, pas « champ invalide ». */
    var messages = {
      prenom:  "Indiquez votre prénom, pour que je sache comment vous appeler.",
      tel:     "Indiquez un numéro de téléphone où je peux vous joindre.",
      dispo:   "Indiquez vos disponibilités — par exemple : lundi et jeudi après 17 h.",
      email:   "Cette adresse e-mail semble incomplète. Vérifiez qu’elle contient une arobase et un point."
    };

    var libelle = function (champ) {
      var lab = form.querySelector('label[for="' + champ.id + '"]');
      if (!lab) return champ.name || champ.id;
      /* On ne garde que le libellé, sans la mention « — facultatif ». */
      return lab.textContent.replace(/—.*$/, "").trim();
    };

    var effacer = function (champ) {
      champ.removeAttribute("aria-invalid");
      var msg = document.getElementById(champ.id + "-erreur");
      if (msg) msg.remove();
      /* On rend au champ son aria-describedby d'origine (l'aide). */
      if (champ.dataset.describedbyOrigine !== undefined) {
        if (champ.dataset.describedbyOrigine) {
          champ.setAttribute("aria-describedby", champ.dataset.describedbyOrigine);
        } else {
          champ.removeAttribute("aria-describedby");
        }
      }
    };

    var marquer = function (champ, texte) {
      champ.setAttribute("aria-invalid", "true");

      if (champ.dataset.describedbyOrigine === undefined) {
        champ.dataset.describedbyOrigine = champ.getAttribute("aria-describedby") || "";
      }

      var id = champ.id + "-erreur";
      var msg = document.getElementById(id);
      if (!msg) {
        msg = document.createElement("span");
        msg.className = "erreur";
        msg.id = id;
        champ.parentNode.appendChild(msg);
      }
      msg.textContent = texte;

      /* L'erreur est annoncée AVANT l'aide : c'est elle qui presse. */
      var origine = champ.dataset.describedbyOrigine;
      champ.setAttribute("aria-describedby", origine ? id + " " + origine : id);
    };

    /* Une fois le champ signalé, on le rend « propre » dès qu'il redevient
       valide : corriger son erreur ne doit pas demander de re-soumettre. */
    var surveiller = function (champ) {
      if (champ.dataset.surveille) return;
      champ.dataset.surveille = "1";
      champ.addEventListener("input", function () {
        if (champ.getAttribute("aria-invalid") === "true" && champ.checkValidity()) {
          effacer(champ);
        }
      });
    };

    form.addEventListener("submit", function (e) {
      var champs = form.querySelectorAll("input, textarea, select");
      var fautifs = [];

      Array.prototype.forEach.call(champs, function (champ) {
        if (champ.type === "hidden" || champ.name === "SITE_WEB") return;
        effacer(champ);
        if (champ.checkValidity()) return;

        var texte = messages[champ.id];
        if (!texte) {
          texte = champ.validity.valueMissing
            ? "Ce champ est nécessaire pour que je puisse vous répondre."
            : "Cette information n’est pas au bon format.";
        }
        marquer(champ, texte);
        surveiller(champ);
        fautifs.push(champ);
      });

      if (!fautifs.length) {
        if (resume) resume.hidden = true;
        return; /* envoi normal */
      }

      e.preventDefault();

      if (resume && resumeListe) {
        resumeListe.innerHTML = "";
        fautifs.forEach(function (champ) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + champ.id;
          a.textContent = libelle(champ);
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            champ.focus();
          });
          li.appendChild(a);
          li.appendChild(document.createTextNode(" — " + (messages[champ.id] || "à compléter.")));
          resumeListe.appendChild(li);
        });
        resume.hidden = false;
        resume.focus();
      } else {
        fautifs[0].focus();
      }
    });
  }

  /* ── 6 · Message d'échec d'envoi — le Worker Cloudflare redirige vers
     contact.html?probleme=RAISON#formulaire quand Brevo/Turnstile refuse
     l'envoi. On révèle le bandeau prévu dans le HTML (masqué par défaut)
     et on y déplace le focus, même parti que le résumé d'erreurs du §5 :
     pas de role="alert", le déplacement de focus suffit à l'annoncer une
     fois. Sans JS, l'utilisateur ne voit pas ce bandeau mais le formulaire
     reste utilisable pour réessayer. ── */
  var probleme = new URLSearchParams(window.location.search).get("probleme");
  var bandeauProbleme = document.getElementById("form-probleme");
  if (probleme && bandeauProbleme) {
    bandeauProbleme.hidden = false;
    bandeauProbleme.focus();
  }

  /* ── 5 · Fenêtres photo — la photo défile au scroll, comme vue par un
     hublot. L'image mesure 220% de la hauteur de sa fenêtre (voir CSS) ;
     on fait glisser son offset vertical en pixels entre 0 (haut de la
     photo visible) et -120% de la hauteur de la fenêtre (bas de la photo
     visible), au fil de la progression de la fenêtre dans l'écran.
     Désactivé si prefers-reduced-motion : l'image reste centrée
     (déjà le cas par défaut en CSS, -60%). ── */
  var photoImgs = document.querySelectorAll(".photo-window img");
  var reduitMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (photoImgs.length && !reduitMotion) {
    var tickingPhoto = false;
    var updatePhotoWindows = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      Array.prototype.forEach.call(photoImgs, function (img) {
        var rect = img.parentElement.getBoundingClientRect();
        if (!rect.height) return;
        var total = vh + rect.height;
        var progress = (vh - rect.top) / total; /* 0 à l'entrée basse, 1 à la sortie haute */
        progress = Math.max(0, Math.min(1, progress));
        var course = rect.height * 1.2; /* image = 220% de la fenêtre : 120% de marge de manœuvre */
        var decalage = -1 * course * progress;
        img.style.transform = "translateY(" + decalage.toFixed(1) + "px)";
      });
      tickingPhoto = false;
    };
    var onScrollPhoto = function () {
      if (!tickingPhoto) {
        window.requestAnimationFrame(updatePhotoWindows);
        tickingPhoto = true;
      }
    };
    window.addEventListener("scroll", onScrollPhoto, { passive: true });
    window.addEventListener("resize", onScrollPhoto);
    window.addEventListener("load", updatePhotoWindows);
    updatePhotoWindows();
  }
})();
