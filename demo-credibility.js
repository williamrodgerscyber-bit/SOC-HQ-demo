/* ==========================================================================
   SOC-HQ public demo — credibility overlay
   --------------------------------------------------------------------------
   Drop-in companion to assets/visuals.css. It adds three things without
   touching the built application bundle:

     1. A visible demo notice on every screen, with a toggle that reveals the
        planned screens the navigation would otherwise promise.
     2. "planned" / "outline" labels on navigation links that do not lead to a
        working screen, plus a banner at the top of those pages.
     3. Honest wording in place of the frozen "Last check: <build time>" text
        on the readiness cards.

   Loaded only by demo builds from VITE_DEMO_BASE after the app entrypoint.
   ========================================================================== */

(function () {
  "use strict";

  /* Screens whose navigation entry leads to a "Designed · Not Implemented"
     spec page — the layout is real, the workflow is not. */
  var PLANNED = [
    "/my-lab",
    "/my-lab/infrastructure",
    "/my-lab/red-team",
    "/my-lab/blue-team",
    "/my-lab/purple-team",
    "/my-lab/management",
    "/soc-analyst/shift-mode",
    "/soc-analyst/study-mode",
    "/soc-analyst/my-cases",
    "/detection-engineering/backlog",
    "/detection-engineering/library",
    "/detection-engineering/tests",
    "/detection-engineering/tuning",
    "/detection-engineering/release",
    "/situation-room",
    "/my-portfolio",
    "/where-i-am"
  ];

  /* Collection shells that exist but hold no articles yet. */
  var OUTLINE = [
    "/knowledge-center/map-1",
    "/knowledge-center/map-2",
    "/knowledge-center/windows-events",
    "/knowledge-center/sysmon-events",
    "/knowledge-center/mitre-attack",
    "/knowledge-center/attack-catalog",
    "/knowledge-center/spl-reference",
    "/knowledge-center/telemetry",
    "/knowledge-center/runbooks"
  ];

  var HIDDEN_COUNT = PLANNED.length + OUTLINE.length;

  var BASE = "/SOC-HQ-demo/";
  var script = document.currentScript;
  if (script && script.src) {
    try {
      var srcPath = new URL(script.src, window.location.href).pathname;
      var baseMatch = srcPath.match(/^(.*\/)demo-credibility\.js$/);
      if (baseMatch) BASE = baseMatch[1];
    } catch (error) {
      /* keep the default prefix */
    }
  }

  var expanded = false;
  var notice = null;
  var banner = null;
  var queued = false;

  /* --- helpers ---------------------------------------------------------- */

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function routeOf(pathname) {
    var path = pathname || "/";
    var prefix = BASE.replace(/\/$/, "");
    if (prefix && path.indexOf(prefix) === 0) path = path.slice(prefix.length);
    if (!path) path = "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
  }

  function stateFor(route) {
    if (PLANNED.indexOf(route) !== -1) return "planned";
    if (OUTLINE.indexOf(route) !== -1) return "outline";
    return null;
  }

  function topLevel(main) {
    for (var i = 0; i < main.children.length; i++) {
      if (main.children[i].classList.contains("page-header")) return main.children[i];
    }
    return null;
  }

  function insertAfterHeader(main, node) {
    var header = topLevel(main);
    if (header) main.insertBefore(node, header.nextSibling);
    else main.insertBefore(node, main.firstChild);
  }

  /* The app renders after this script runs, so an early insertion can land
     above the page title. Move the notice back under it once it exists. */
  function placeAfterHeader(main, node) {
    var header = topLevel(main);
    if (!header || node === header) return;
    var position = node.compareDocumentPosition(header);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      main.insertBefore(node, header.nextSibling);
    }
  }

  /* --- demo notice ------------------------------------------------------ */

  function buildNotice() {
    var box = element("div", "demo-notice");
    box.id = "demo-notice";
    box.setAttribute("role", "note");
    box.appendChild(element("span", "demo-notice-badge", "Demo"));

    var copy = element("p", "demo-notice-copy");
    copy.appendChild(element("strong", null, "Read-only build"));
    copy.appendChild(
      document.createTextNode(
        " — all data is preset training data. No live lab, no backend."
      )
    );
    box.appendChild(copy);

    var toggle = element("button", "demo-notice-toggle", "");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () {
      expanded = !expanded;
      paint();
    });
    box.appendChild(toggle);
    return box;
  }

  function updateNotice() {
    if (!notice) return;
    document.documentElement.setAttribute(
      "data-demo-show-planned",
      expanded ? "true" : "false"
    );
    var toggle = notice.querySelector(".demo-notice-toggle");
    if (!toggle) return;
    toggle.textContent = expanded
      ? "Hide planned screens"
      : "Show planned screens (" + HIDDEN_COUNT + ")";
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  /* --- page banner for unfinished screens ------------------------------- */

  function pageState() {
    if (document.querySelector(".workspace-intro")) return "planned";
    var empties = document.querySelectorAll(".knowledge-empty");
    for (var i = 0; i < empties.length; i++) {
      if (/not yet populated/i.test(empties[i].textContent || "")) return "outline";
    }
    return null;
  }

  function buildBanner() {
    var box = element("div", "demo-page-banner");
    box.id = "demo-page-banner";
    box.appendChild(element("span", "demo-page-banner-tag", "Planned screen"));
    box.appendChild(element("p", "demo-page-banner-text", ""));
    return box;
  }

  function paintBanner(main) {
    var state = main ? pageState() : null;
    if (!state) {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      return;
    }
    if (!banner) banner = buildBanner();
    banner.setAttribute("data-state", state);

    var tag = banner.querySelector(".demo-page-banner-tag");
    var text = banner.querySelector(".demo-page-banner-text");
    if (state === "planned") {
      tag.textContent = "Planned screen";
      text.textContent =
        "This screen is designed, not built. The demo shows the intended layout and workflow — nothing here is connected or working.";
    } else {
      tag.textContent = "Outline only";
      text.textContent =
        "This collection is a structure, not a library. Its articles are not written into the demo yet, and none are invented to fill the space.";
    }

    if (banner.parentNode !== main) {
      if (notice && notice.parentNode === main) main.insertBefore(banner, notice.nextSibling);
      else insertAfterHeader(main, banner);
    } else if (notice && notice.parentNode === main && banner.previousSibling !== notice) {
      main.insertBefore(banner, notice.nextSibling);
    }
  }

  /* --- navigation labels ------------------------------------------------ */

  /* The app uses NavLink with `end` only on "/", so a parent link such as
     /knowledge-center stays highlighted on /knowledge-center/cheat-sheets.
     Keep exactly one active entry, the one for the current route. */
  function enforceSingleActive(links, route) {
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var linkRoute = routeOf(link.pathname || link.getAttribute("href") || "");
      if (linkRoute === route) {
        if (!link.classList.contains("active")) link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    }
  }

  function annotateNav() {
    var nav = document.querySelector(".main-nav");
    if (!nav) return;

    var links = nav.querySelectorAll("a.nav-link");
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var state = stateFor(routeOf(link.pathname || link.getAttribute("href") || ""));
      if (state) link.setAttribute("data-demo-state", state);
      else link.removeAttribute("data-demo-state");
    }

    enforceSingleActive(links, routeOf(window.location.pathname));

    var groups = nav.querySelectorAll(".nav-group");
    for (var g = 0; g < groups.length; g++) {
      var groupLinks = groups[g].querySelectorAll("a.nav-link");
      var allPlanned = groupLinks.length > 0;
      for (var k = 0; k < groupLinks.length; k++) {
        if (!groupLinks[k].hasAttribute("data-demo-state")) allPlanned = false;
      }
      if (allPlanned) groups[g].setAttribute("data-demo-group", "planned");
      else groups[g].removeAttribute("data-demo-group");
    }
  }

  /* --- readiness timestamps -------------------------------------------- */

  function relabelTimestamps() {
    var metas = document.querySelectorAll(".card-meta");
    for (var i = 0; i < metas.length; i++) {
      var meta = metas[i];
      var text = (meta.textContent || "").trim();
      var card = meta.closest ? meta.closest(".readiness-card") : null;
      var heading = card ? card.querySelector("h3") : null;
      var isLocalApi = heading ? /local api/i.test(heading.textContent || "") : false;

      if (text.indexOf("Last check:") === 0) {
        meta.textContent = isLocalApi
          ? "No live service here"
          : "Preset data · not live";
        meta.title =
          "Every readiness value in this build is preset training data from the demo snapshot. Nothing on this page is a live check.";
      } else if (isLocalApi && text.indexOf("SOURCE ·") === 0) {
        meta.textContent = "PRESET DEMO DATA";
        meta.title = "This build has no backend, so the local API is not running here.";
      }
    }
  }

  /* --- paint ------------------------------------------------------------ */

  function paint() {
    queued = false;

    var main = document.querySelector(".main-content");
    if (main) {
      if (!notice) notice = buildNotice();
      if (notice.parentNode !== main) insertAfterHeader(main, notice);
      else placeAfterHeader(main, notice);
      updateNotice();
    }

    annotateNav();
    paintBanner(main);
    relabelTimestamps();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(paint);
    else window.setTimeout(paint, 16);
  }

  function isOurs(node) {
    return (
      (notice && (node === notice || notice.contains(node))) ||
      (banner && (node === banner || banner.contains(node)))
    );
  }

  function start() {
    paint();

    var target = document.getElementById("root") || document.body;
    if (!target || !window.MutationObserver) return;

    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        if (!isOurs(records[i].target)) {
          schedule();
          return;
        }
      }
    }).observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
