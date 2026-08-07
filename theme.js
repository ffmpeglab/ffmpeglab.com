/**
 * FFmpegLab Theme Toggle
 * Single embeddable script — no dependencies.
 * Adds a light/dark toggle that adjusts CSS theme variables.
 * Dark-mode styles are injected only when active and removed completely
 * when light mode is on, so the page reverts to its original stylesheet.
 * Usage: <script src="/theme.js"></script>
 */
(function () {
  "use strict";

  var STORAGE_KEY = "ffmpeglab-theme";
  var DARK = "dark";
  var LIGHT = "light";
  var BUTTON_STYLE_ID = "fflab-theme-button-style";
  var DARK_STYLE_ID = "fflab-theme-dark-style";

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStored(val) {
    try { localStorage.setItem(STORAGE_KEY, val); } catch (e) {}
  }

  function getPreferred() {
    var stored = getStored();
    if (stored === DARK || stored === LIGHT) return stored;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return DARK;
    } catch (e) {}
    return LIGHT;
  }

  /* ---- Button styling (always present so the toggle looks right in both modes) ---- */
  function injectButtonStyles() {
    if (document.getElementById(BUTTON_STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = BUTTON_STYLE_ID;
    style.textContent = [
      "#fflab-theme-toggle{",
        "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;",
        "display:flex;align-items:center;justify-content:center;",
        "width:2.75rem;height:2.75rem;border-radius:50%;",
        "border:1px solid #ECE9F3;",
        "background:#fff;color:#4A4566;",
        "cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);",
        "transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease,color .2s ease;",
        "font-family:inherit;",
      "}",
      "#fflab-theme-toggle:hover{",
        "transform:translateY(-2px);",
        "box-shadow:0 4px 16px rgba(0,0,0,.18);",
        "border-color:#FC6D26;",
      "}",
      "#fflab-theme-toggle:active{transform:translateY(0);}",
      "#fflab-theme-toggle svg{width:1.15rem;height:1.15rem;}",
    ].join("");
    document.head.appendChild(style);
  }

  /* ---- Dark-mode styles (injected only when dark is active) ---- */
  function injectDarkStyles() {
    if (document.getElementById(DARK_STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = DARK_STYLE_ID;
    style.textContent = [
      /* ---- Dark mode variable overrides ---- */
      "html[data-theme=\"dark\"]{",
        "--orange:#FC6D26;",
        "--ink:#F2EFF8;",
        "--muted:#B0AAC4;",
        "--muted-2:#9A94B0;",
        "--faint:#807A9A;",
        "--fflab-page-bg:#15121F;",
        "--fflab-header-bg:rgba(21,18,31,0.92);",
        "--fflab-header-border:#2E2A40;",
        "--fflab-section-bg:#1E1A2C;",
        "--fflab-section-border:#2E2A40;",
        "--fflab-prose-color:#D6D2E6;",
        "--fflab-code-bg:#2A2540;",
        "--fflab-code-color:#C9C4DE;",
        "--fflab-callout-bg:#2D1F14;",
        "--fflab-callout-border:#5C3520;",
        "--fflab-card-bg:#1E1A2C;",
        "--fflab-card-border:#2E2A40;",
        "--fflab-footer-bg:#0D0B14;",
        "--fflab-footer-link:#807A9A;",
        "--fflab-footer-link-hover:#F2EFF8;",
        "--fflab-footer-copy:#6B6685;",
      "}",

      /* ---- Dark button colors ---- */
      "html[data-theme=\"dark\"] #fflab-theme-toggle{",
        "border-color:#2E2A40;",
        "background:#1E1A2C;color:#B0AAC4;",
      "}",

      /* ---- Apply dark variables to selectors with hardcoded colors in blog.css ---- */
      "html[data-theme=\"dark\"] body{background:var(--fflab-page-bg);}",
      "html[data-theme=\"dark\"] main{background:var(--fflab-page-bg);}",
      "html[data-theme=\"dark\"] section{background:var(--fflab-page-bg)!important;}",
      "html[data-theme=\"dark\"] .guide-card{background:var(--fflab-page-bg)!important;}",
      "html[data-theme=\"dark\"] header.site{border-bottom-color:var(--fflab-header-border);background:var(--fflab-header-bg);}",
      "html[data-theme=\"dark\"] .article-head{background:var(--fflab-section-bg);border-bottom-color:var(--fflab-section-border);}",
      "html[data-theme=\"dark\"] .prose{color:var(--fflab-prose-color);}",
      "html[data-theme=\"dark\"] .prose code{background:var(--fflab-code-bg);color:var(--fflab-code-color);}",
      "html[data-theme=\"dark\"] .callout{background:var(--fflab-callout-bg);border-color:var(--fflab-callout-border);}",
      "html[data-theme=\"dark\"] .related{border-top-color:var(--fflab-section-border);background:var(--fflab-section-bg);}",
      "html[data-theme=\"dark\"] .related-card{border-color:var(--fflab-card-border);background:var(--fflab-card-bg);}",
      "html[data-theme=\"dark\"] .related-card:hover{border-color:var(--orange,#FC6D26);}",
      "html[data-theme=\"dark\"] .sources{border-top-color:var(--fflab-section-border);}",
      "html[data-theme=\"dark\"] footer.site{background:var(--fflab-footer-bg);}",
      "html[data-theme=\"dark\"] footer.site .links a{color:var(--fflab-footer-link);}",
      "html[data-theme=\"dark\"] footer.site .links a:hover{color:var(--fflab-footer-link-hover);}",
      "html[data-theme=\"dark\"] footer.site .copy{color:var(--fflab-footer-copy);}",
    ].join("");
    document.head.appendChild(style);
  }

  function removeDarkStyles() {
    var existing = document.getElementById(DARK_STYLE_ID);
    if (existing) existing.parentNode.removeChild(existing);
  }

  function applyTheme(theme) {
    var html = document.documentElement;
    html.setAttribute("data-theme", theme);

    if (theme === DARK) {
      injectDarkStyles();
    } else {
      removeDarkStyles();
    }

    var btn = document.getElementById("fflab-theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", theme === DARK ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("title", theme === DARK ? "Switch to light mode" : "Switch to dark mode");
      var sun = btn.querySelector(".fflab-icon-sun");
      var moon = btn.querySelector(".fflab-icon-moon");
      if (sun && moon) {
        sun.style.display = theme === DARK ? "block" : "none";
        moon.style.display = theme === DARK ? "none" : "block";
      }
    }
  }

  function toggle() {
    var current = document.documentElement.getAttribute("data-theme") || LIGHT;
    var next = current === DARK ? LIGHT : DARK;
    setStored(next);
    applyTheme(next);
  }

  function injectButton() {
    if (document.getElementById("fflab-theme-toggle")) return;

    var btn = document.createElement("button");
    btn.id = "fflab-theme-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle theme");

    var sun = '<svg class="fflab-icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    var moon = '<svg class="fflab-icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    btn.innerHTML = sun + moon;
    btn.addEventListener("click", toggle);
    document.body.appendChild(btn);
  }

  function init() {
    injectButtonStyles();
    injectButton();
    applyTheme(getPreferred());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
