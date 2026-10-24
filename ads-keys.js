/* ===== DUMMY/TEST AD UNIT CODES (Replace with real GAM ad units before going live) ===== */

window.adsKeys = {
    display_001: "/23338698373/smartfinancequiz_display_001",
    display_002: "/23338698373/smartfinancequiz_display_002",
    display_003: "/23338698373/smartfinancequiz_display_003",
    interstitial_001: "/23338698373/smartfinancequiz_interstitial_001",
    anchor_001: "/23338698373/smartfinancequiz_anchor_001",
    rewoarded_001: "/23338698373/smartfinancequiz_rewarded_001",
};

console.log("[ADKEYS] ads-keys.js LOADED. Ad units:", JSON.stringify(window.adsKeys));


let rewardedAd = null;
let isRewardReady = false;
let pendingUrl = null;
let showRewardedFn = null;


/*-------------- REWARDED SLOT (must be defined BEFORE enableServices) -------------------*/
/* ads-keys.js loads synchronously in <head>, so this queues the rewarded slot
   before any body inline banner script calls googletag.enableServices(). */

window.googletag = window.googletag || { cmd: [] };

googletag.cmd.push(function () {

    console.log("[GPT] Rewarded slot setup START...");

    if (rewardedAd) {
        console.log("[GPT] Rewarded slot already exists, skipping.");
        return;
    }

    rewardedAd = googletag.defineOutOfPageSlot(
        adsKeys.rewoarded_001,
        googletag.enums.OutOfPageFormat.REWARDED
    );

    if (!rewardedAd) {
        console.error("[GPT] ❌ Rewarded slot FAILED to create. Ad unit:", adsKeys.rewoarded_001);
        return;
    }

    console.log("[GPT] ✔ Rewarded slot DEFINED with unit:", adsKeys.rewoarded_001);

    rewardedAd.addService(googletag.pubads());

    /* READY EVENT – store makeRewardedVisible + notify listeners */
    googletag.pubads().addEventListener("rewardedSlotReady", function (evt) {
        if (evt.slot !== rewardedAd) return;
        console.log("[GPT] ✔✔✔ rewardedSlotReady FIRED! Reward is ready to show.");
        isRewardReady = true;
        showRewardedFn = evt.makeRewardedVisible;
        // Notify google-reward.js / others that reward is available
        try { window.dispatchEvent(new Event("gptRewardReady")); } catch (e) { }
    });

    /* IMPRESSION EVENT */
    googletag.pubads().addEventListener("rewardedSlotGranted", function (evt) {
        if (evt.slot !== rewardedAd) return;
        console.log("[GPT] 🎁 rewardedSlotGranted — Reward given to user!");
    });

    /* CLOSE EVENT */
    googletag.pubads().addEventListener("rewardedSlotClosed", function (evt) {
        if (evt.slot !== rewardedAd) return;
        console.log("[GPT] Rewarded slot CLOSED.");
        if (pendingUrl) {
            window.location.href = pendingUrl;
            pendingUrl = null;
        }
    });

    console.log("[GPT] Rewarded slot setup COMPLETE. Waiting for enableServices()...");

});


/*-------------- End ----------------------*/


/*-------------- INTERSTITIAL (MUST be defined BEFORE enableServices) -------------------*/
/* Interstitials, like rewarded, are only evaluated at enableServices() time.
   We show one on pages reached via a quiz-option click (flag set in script.js),
   AND automatically on page load for start/play-quiz pages (mirrors the live
   PubMonetX pmx_trigger=load behaviour on those pages). */
let interstitialAd = null;

googletag.cmd.push(function () {
    var flag = '';
    try { flag = sessionStorage.getItem('showInterOnNext'); } catch (e) { }

    var interOnLoadPages = ['/start', '/start.html', '/play-quiz', '/play-quiz.html'];
    var onPage = window.location.pathname.replace(/\/+$/, '') || '/';
    var isInterLoadPage = interOnLoadPages.indexOf(onPage) !== -1;

    if (flag !== '1' && !isInterLoadPage) {
        console.log("[INTERSTITIAL] Flag not set & not an on-load page → no interstitial on this page load.");
        return;
    }
    if (flag === '1') {
        try { sessionStorage.removeItem('showInterOnNext'); } catch (e) { }
    }
    console.log("[INTERSTITIAL] Showing interstitial because:", flag === '1' ? 'click-flag set' : 'on-load page: ' + onPage);

    interstitialAd = googletag.defineOutOfPageSlot(
        adsKeys.interstitial_001,
        googletag.enums.OutOfPageFormat.INTERSTITIAL
    );

    if (!interstitialAd) {
        console.error("[INTERSTITIAL] ❌ Slot failed to create. Unit:", adsKeys.interstitial_001);
        return;
    }

    interstitialAd.addService(googletag.pubads());
    console.log("[INTERSTITIAL] ✔ Slot defined BEFORE enableServices. Unit:", adsKeys.interstitial_001);

    googletag.pubads().addEventListener("interstitialSlotLoaded", function (evt) {
        if (evt.slot !== interstitialAd) return;
        console.log("[INTERSTITIAL] ✔ Ad loaded → auto-displaying now.");
    });

    googletag.pubads().addEventListener("interstitialSlotDismissed", function (evt) {
        if (evt.slot !== interstitialAd) return;
        console.log("[INTERSTITIAL] Dismissed by user.");
    });
});
/*-------------- End INTERSTITIAL ----------------------*/


/*-------------- ANCHOR AD (Sticky Bottom Banner) -------------------*/
/* Native GAM BOTTOM_ANCHOR behaviour:
   - full expanded when the page first opens
   - half-minimises as the user scrolls
   - fully-minimised (small tab) after more scrolling
   Must be defined BEFORE enableServices (ads-keys.js is in <head>). */
let anchorAd = null;

(function checkAnchorEnv() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    var portrait = (window.innerHeight || 0) >= w;
    var supported = (w >= 320 && w <= 1000);
    console.log("[ANCHOR] Env check → width:", w + "px", "| portrait:", portrait, "| in 320-1000px range:", supported,
        supported ? "" : "→ ANCHOR WILL NOT RENDER (Google only shows anchors in a portrait viewport 320-1000px wide). Use DevTools device mode or a phone.");
})();

googletag.cmd.push(function () {
    if (anchorAd) return;

    /* Anchor allowed ONLY on the home page (index) — skipped on all other pages. */
    var anchorPages = ['/', '/index.html'];
    var anchorOnPath = window.location.pathname.replace(/\/+$/, '') || '/';
    if (anchorPages.indexOf(anchorOnPath) === -1) {
        console.log("[ANCHOR] Skipped — anchor is enabled only on home page. Current page:", anchorOnPath);
        return;
    }

    // Anchor needs an explicit responsive size mapping or it returns empty.
    var anchorMapping = googletag.sizeMapping()
        .addSize([1024, 0], [[728, 90], [970, 90]])   // desktop
        .addSize([0, 0], [[320, 50], [300, 50], [300, 100], [320, 100]]) // mobile
        .build();

    anchorAd = googletag.defineOutOfPageSlot(
        adsKeys.anchor_001,
        googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR
    );

    if (!anchorAd) {
        console.error("[ANCHOR] ❌ defineOutOfPageSlot returned null. Unit:", adsKeys.anchor_001,
            "| Reason: viewport not supported (needs portrait, 320-1000px wide). TEST TIP: open in mobile/device mode, or append #gamBottomAnchorDemo to the URL to force a Google demo anchor.");
        return;
    }

    anchorAd.addService(googletag.pubads()).defineSizeMapping(anchorMapping);
    console.log("[ANCHOR] ✔ Bottom anchor defined BEFORE enableServices. Unit:", adsKeys.anchor_001);

    googletag.pubads().addEventListener("slotRenderEnded", function (evt) {
        if (evt.slot !== anchorAd) return;
        console.log("[ANCHOR] Rendered. isEmpty:", evt.isEmpty, ". If true → no fill / try Incognito or refresh.");
    });

    // TEST HINT: appending #gamBottomAnchorDemo to the URL makes Google force a demo anchor.
    if (location.hash === '#gamBottomAnchorDemo') {
        console.log("[ANCHOR] Demo hash detected (#gamBottomAnchorDemo) → Google will render a preview anchor ad.");
    }
});
/*-------------- End ANCHOR ----------------------*/


var isRootOrIndexWithoutQuestionParam = () => {
    const { pathname, search } = window.location;
    const isCorrectPath =
        pathname === '/' || pathname === '/index.html';
    const hasNoQuestionParam = !new URLSearchParams(search).has('question');
    return isCorrectPath && hasNoQuestionParam;
};

/* ---------- SHOW REWARD WHEN USER CLICKS ---------- */
function showRewardAndGo(url) {
    console.log("[GPT] showRewardAndGo() called. isRewardReady:", isRewardReady, "url:", url);
    pendingUrl = url;

    if (isRewardReady && typeof showRewardedFn === "function") {
        console.log("[GPT] ✔ Showing Reward instantly...");
        try {
            showRewardedFn();
        } catch (err) {
            console.error("[GPT] ❌ Instant show error:", err);
            if (url) window.location.href = url;
        }
        return;
    }

    console.warn("[GPT] ⚠️ Reward NOT ready → redirecting directly.");
    if (url) window.location.href = url;
}

/* ---------- START (no-op: slot already defined above) ---------- */
function preloadReward() { /* rewarded slot defined at load time in head */ }


/* ============================================================
   TRIGGER INTERSTITIAL ON QUIZ OPTION CLICK
   Sets a flag + navigates. The destination page's ads-keys.js
   (loaded in <head>) reads the flag and defines the interstitial
   BEFORE enableServices so GPT auto-shows it on arrival.
   ============================================================ */
function showInterstitialAndGo(url) {
    console.log("[INTERSTITIAL] showInterstitialAndGo() called. url:", url);
    if (!url) return;
    try { sessionStorage.setItem('showInterOnNext', '1'); } catch (e) { }
    window.location.href = url;
}
