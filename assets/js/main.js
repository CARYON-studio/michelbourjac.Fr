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
})();
