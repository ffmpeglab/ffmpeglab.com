/*
 * FFmpegLab Newsletter Embed — no dependencies
 *
 * Expected HTML: /newsletter-section-embed.html
 * Finds every [data-ffmpeglab-newsletter] instance on the page and adds:
 * - compact fixed liquid-glass dock
 * - shared email value and submission state
 * - IntersectionObserver handoff into the full section
 * - FLIP-style dock-to-section morph
 * - Web Animations API liquid lights
 * - JSON submission to data-endpoint (defaults to /_ploy/form-submit)
 */

(function () {
  "use strict";
  const supabaseClient = window.supabase.createClient('https://office.starpy.me', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE")

  var SELECTOR = "[data-ffmpeglab-newsletter]";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initialize() {
    var sections = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < sections.length; i += 1) enhance(sections[i], i);
  }

  function enhance(section, index) {
    if (section.getAttribute("data-newsletter-enhanced") === "true") return;
    section.setAttribute("data-newsletter-enhanced", "true");

    var endpoint = section.getAttribute("data-endpoint") || "/_ploy/form-submit";
    var formName = section.getAttribute("data-form-name") || "ffmpeglab-newsletter";
    var source = section.getAttribute("data-source") || "embedded-newsletter";
    var fullForm = section.querySelector("[data-newsletter-form]");
    var fullInput = section.querySelector("[data-newsletter-email]");
    var fullSubmit = section.querySelector("[data-newsletter-submit]");
    var fullSuccess = section.querySelector("[data-newsletter-success]");
    var fullError = section.querySelector("[data-newsletter-error]");
    var glass = section.querySelector("[data-newsletter-glass]");
    var released = false;
    var submitting = false;

    if (!fullForm || !fullInput || !fullSubmit || !fullSuccess || !glass) return;

    animateLights(section);
    addResponsiveFallback(section);

    var dock = buildDock(index);
    var dockForm = dock.querySelector("form");
    var dockInput = dock.querySelector("input");
    var dockSubmit = dock.querySelector("button");
    var dockCopy = dock.querySelector("[data-dock-copy]");
    document.body.appendChild(dock);

    syncInputs(fullInput, dockInput);

    async function onSubmit(event) {
      event.preventDefault();
      var email = (event.currentTarget.querySelector("input[type=email]") || fullInput).value.trim();
      if (!email || submitting) return;

      fullInput.value = email;
      dockInput.value = email;
      submitting = true;
      setLoading(true);
      if (fullError) fullError.hidden = true;

    //   const emailRedirectTo =
    //   env.config.public_host +
    //   (Platform.OS === 'web'
    //     ? window.location.pathname
    //     : makeRedirectUri({path: pathname}));
    // console.info({emailRedirectTo});
        const {
        data: {session},
        error,
        } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
            // emailRedirectTo: emailRedirectTo,
        },
        });
        console.info(session,error)
        setLoading(false);
        if(error) {
          submitting = false;
          setLoading(false);
          if (fullError) fullError.hidden = false;
          shake(event.currentTarget);
        }
        else {
            showSuccess();
        }
    //     fetch(endpoint, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     keepalive: true,
    //     body: JSON.stringify({
    //       formName: formName,
    //       pageUrl: window.location.href,
    //       data: { email: email, source: source },
    //     }),
    //   })
    //     .then(function (response) {
    //       if (!response.ok) throw new Error("Newsletter submission failed: " + response.status);
    //       showSuccess();
    //     })
    //     .catch(function () {
    //       submitting = false;
    //       setLoading(false);
    //       if (fullError) fullError.hidden = false;
    //       shake(event.currentTarget);
    //     });
    }

    fullForm.addEventListener("submit", onSubmit);
    dockForm.addEventListener("submit", onSubmit);

    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0] && entries[0].isIntersecting && !released) {
          released = true;
          morphDockIntoSection(dock, glass, function () {
            dock.remove();
          });
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(section);

    function setLoading(isLoading) {
      fullSubmit.disabled = isLoading;
      dockSubmit.disabled = isLoading;
      fullSubmit.textContent = isLoading ? "Joining…" : "Subscribe →";
      dockSubmit.textContent = isLoading ? "…" : "Subscribe →";
      fullSubmit.style.opacity = isLoading ? "0.72" : "1";
      dockSubmit.style.opacity = isLoading ? "0.72" : "1";
    }

    function showSuccess() {
      submitting = false;
      setLoading(false);
      fullForm.hidden = true;
      fullSuccess.hidden = false;
      dockCopy.innerHTML = '<strong style="display:block;color:#211b3a;font-size:15px;">You’re on the list.</strong><span style="display:block;margin-top:2px;color:#655d72;font-size:12px;">The next useful FFmpeg idea is headed your way.</span>';
      dockForm.hidden = true;
      if (!reduceMotion) {
        fullSuccess.animate(
          [
            { opacity: 0, transform: "translateY(12px) scale(.94)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ],
          { duration: 520, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
        );
      }
    }
  }

  function buildDock(index) {
    var dock = document.createElement("aside");
    dock.setAttribute("aria-label", "Newsletter signup");
    dock.style.cssText = "position:fixed;z-index:999;left:16px;right:16px;bottom:18px;max-width:400px;margin:0 auto;padding:8px;border:1px solid rgba(255,255,255,.78);border-radius:22px;background:rgba(255,255,255,.64);box-shadow:0 24px 70px -24px rgba(33,27,58,.55);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);color:#211b3a;overflow:hidden;";

    dock.innerHTML =
      '<div style="position:relative;display:flex;gap:10px;flex-direction:column;width:100%;box-sizing:border-box;padding:11px;border:1px solid rgba(255,255,255,.65);border-radius:16px;background:rgba(255,255,255,.42);">' +
        '<div style="display:flex;flex-direction:row">'+
        '<div style="display:flex;width:46px;vertical-align:middle;"><span style="display:inline-block;width:40px;height:40px;border-radius:12px;background:#fc6d26;color:#fff;font-size:20px;line-height:40px;text-align:center;box-shadow:0 5px 12px rgba(252,109,38,.28);">✦</span></div>' +
        '<div data-dock-copy style="display:table-cell;padding:0 12px;vertical-align:middle;white-space:nowrap;"><strong style="display:block;font-size:15px;line-height:1.2;">FFmpeg templates, delivered.</strong><span style="display:block;margin-top:3px;color:#655d72;font-size:12px;line-height:1.2;">Useful commands. New templates. No noise.</span></div>' +
        '</div>'+
        '<div style="display:flex;flex-direction:row">'+
        '<div style="display:table-cell;width:410px;vertical-align:middle;">' +
          '<form style="display:table;width:100%;">' +
            '<label for="newsletter-dock-email-' + index + '" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">Email address</label>' +
            '<div style="display:table-cell;vertical-align:middle;"><input id="newsletter-dock-email-' + index + '" type="email" autocomplete="email" required placeholder="you@example.com" style="box-sizing:border-box;width:100%;height:44px;padding:0 13px;border:1px solid rgba(222,217,230,.9);border-radius:12px;background:rgba(255,255,255,.84);color:#211b3a;font-size:14px;outline:none;" /></div>' +
            '<div style="display:table-cell;width:126px;padding-left:8px;vertical-align:middle;"><button type="submit" style="width:100%;height:44px;border:0;border-radius:12px;background:#211b3a;color:#fff;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 6px 15px rgba(33,27,58,.22);">Subscribe →</button></div>' +
          '</form>' +
        '</div>' +
        '</div>'+
      '</div>';

    if (!reduceMotion) {
      dock.animate(
        [
          { opacity: 0, transform: "translateY(28px) scale(.97)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 600, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
      );
    }
    return dock;
  }

  function syncInputs(first, second) {
    function copy(source, target) {
      target.value = source.value;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
    first.addEventListener("input", function () { copy(first, second); });
    second.addEventListener("input", function () { copy(second, first); });
  }

  function morphDockIntoSection(dock, target, done) {
    if (reduceMotion) {
      done();
      return;
    }

    var from = dock.getBoundingClientRect();
    var to = target.getBoundingClientRect();
    var clone = dock.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.zIndex = "1000";
    clone.style.left = from.left + "px";
    clone.style.top = from.top + "px";
    clone.style.right = "auto";
    clone.style.bottom = "auto";
    clone.style.width = from.width + "px";
    clone.style.height = from.height + "px";
    clone.style.margin = "0";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    dock.style.visibility = "hidden";
    target.style.opacity = "0";

    var animation = clone.animate(
      [
        {
          left: from.left + "px",
          top: from.top + "px",
          width: from.width + "px",
          height: from.height + "px",
          borderRadius: "22px",
          opacity: 1,
        },
        {
          left: to.left + "px",
          top: to.top + "px",
          width: to.width + "px",
          height: to.height + "px",
          borderRadius: "32px",
          opacity: 0.2,
        },
      ],
      { duration: 760, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" },
    );

    target.animate(
      [
        { opacity: 0, transform: "scale(.985)", filter: "blur(8px)" },
        { opacity: 1, transform: "scale(1)", filter: "blur(0)" },
      ],
      { duration: 620, delay: 220, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
    );

    animation.onfinish = function () {
      clone.remove();
      target.style.opacity = "";
      done();
    };
  }

  function animateLights(section) {
    if (reduceMotion || !Element.prototype.animate) return;
    var lights = section.querySelectorAll("[data-liquid-light]");
    for (var i = 0; i < lights.length; i += 1) {
      lights[i].animate(
        [
          { transform: "translate3d(0,0,0) scale(1)" },
          { transform: "translate3d(" + (i % 2 ? -36 : 46) + "px," + (i % 2 ? 34 : -24) + "px,0) scale(1.13)" },
          { transform: "translate3d(0,0,0) scale(1)" },
        ],
        { duration: 9000 + i * 1700, iterations: Infinity, easing: "ease-in-out" },
      );
    }
  }

  function shake(element) {
    if (reduceMotion || !element.animate) return;
    element.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(7px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 360, easing: "ease-out" },
    );
  }

  function addResponsiveFallback(section) {
    var id = "ffmpeglab-newsletter-responsive";
    if (document.getElementById(id)) return;
    var style = document.createElement("style");
    style.id = id;
    style.textContent =
      "@media(max-width:760px){[data-ffmpeglab-newsletter]>div>div>div{display:block!important}[data-ffmpeglab-newsletter]>div>div>div>div{display:block!important;width:auto!important;padding:30px 22px!important}[data-ffmpeglab-newsletter] h2{font-size:36px!important}[data-ffmpeglab-newsletter] form>div{display:block!important}[data-ffmpeglab-newsletter] form>div>div{display:block!important;width:auto!important;padding:0!important}[data-ffmpeglab-newsletter] form button{margin-top:10px!important}aside[aria-label='Newsletter signup'] [data-dock-copy]{}aside[aria-label='Newsletter signup']>div>div:last-child{width:auto!important}}";
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
