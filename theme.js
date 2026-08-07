/**
 * FFmpegLab Theme Toggle
 * Single embeddable script — no dependencies.
 * Adds a light/dark toggle that adjusts CSS theme variables.
 * Usage: <script src="/theme.js"></script>
 */
(function () {
  "use strict";

  var STORAGE_KEY = "ffmpeglab-theme";
  var DARK = "dark";
  var LIGHT = "light";

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

  function applyTheme(theme) {
    var html = document.documentElement;
    html.setAttribute("data-theme", theme);
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

  var styleId = "fflab-theme-style";

  function injectStyles() {
    if (document.getElementById(styleId)) return;
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      /* ---- Toggle button ---- */
      "#fflab-theme-toggle{",
        "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;",
        "display:flex;align-items:center;justify-content:center;",
        "width:2.75rem;height:2.75rem;border-radius:50%;",
        "border:1px solid var(--fflab-border,#ECE9F3);",
        "background:var(--fflab-toggle-bg,#fff);color:var(--fflab-toggle-fg,#4A4566);",
        "cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);",
        "transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;",
        "font-family:inherit;",
      "}",
      "#fflab-theme-toggle:hover{",
        "transform:translateY(-2px);",
        "box-shadow:0 4px 16px rgba(0,0,0,.18);",
        "border-color:var(--orange,#FC6D26);",
      "}",
      "#fflab-theme-toggle:active{transform:translateY(0);}",
      "#fflab-theme-toggle svg{width:1.15rem;height:1.15rem;}",

      /* ---- Light mode (default) adds new variables for hardcoded colors ---- */
      ":root{",
        "--fflab-page-bg:#fff;",
        "--fflab-header-bg:rgba(255,255,255,0.9);",
        "--fflab-header-border:#ECE9F3;",
        "--fflab-section-bg:#FAF8FD;",
        "--fflab-section-border:#ECE9F3;",
        "--fflab-prose-color:#2C2741;",
        "--fflab-code-bg:#F1EEF8;",
        "--fflab-code-color:#3A2E5C;",
        "--fflab-callout-bg:#FFF4ED;",
        "--fflab-callout-border:#FFD8C2;",
        "--fflab-card-bg:#fff;",
        "--fflab-card-border:#ECE9F3;",
        "--fflab-footer-bg:#15121F;",
        "--fflab-footer-link:#8C87A3;",
        "--fflab-footer-link-hover:#fff;",
        "--fflab-footer-copy:#6F6A87;",
        "--fflab-toggle-bg:#fff;",
        "--fflab-toggle-fg:#4A4566;",
        "--fflab-border:#ECE9F3;",
      "}",

      /* ---- Dark mode overrides ---- */
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
        "--fflab-toggle-bg:#1E1A2C;",
        "--fflab-toggle-fg:#B0AAC4;",
        "--fflab-border:#2E2A40;",
      "}",

      /* ---- Apply variables to selectors with hardcoded colors in blog.css ---- */
      "body{background:var(--fflab-page-bg);}",
      "main{background:var(--fflab-page-bg);}",
      "section{background:var(--fflab-page-bg)!important;}",
      ".btn{background:var(--fflab-page-bg)!important;}",
      ".guide-card{background:var(--fflab-page-bg)!important;}",
      "header.site{border-bottom-color:var(--fflab-header-border);background:var(--fflab-header-bg);}",
      ".article-head{background:var(--fflab-section-bg);border-bottom-color:var(--fflab-section-border);}",
      ".prose{color:var(--fflab-prose-color);}",
      ".prose code{background:var(--fflab-code-bg);color:var(--fflab-code-color);}",
      ".callout{background:var(--fflab-callout-bg);border-color:var(--fflab-callout-border);}",
      ".related{border-top-color:var(--fflab-section-border);background:var(--fflab-section-bg);}",
      ".related-card{border-color:var(--fflab-card-border);background:var(--fflab-card-bg);}",
      ".related-card:hover{border-color:var(--orange,#FC6D26);}",
      ".sources{border-top-color:var(--fflab-section-border);}",
      "footer.site{background:var(--fflab-footer-bg);}",
      "footer.site .links a{color:var(--fflab-footer-link);}",
      "footer.site .links a:hover{color:var(--fflab-footer-link-hover);}",
      "footer.site .copy{color:var(--fflab-footer-copy);}",
    ].join("");
    document.head.appendChild(style);
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
    injectStyles();
    injectButton();
    applyTheme(getPreferred());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
