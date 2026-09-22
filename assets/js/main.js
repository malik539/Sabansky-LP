/* ==========================================================================
   Sabinsky Orthodontics — $1,025 Savings PPC Landing Page
   Vanilla JS: attribution capture, PPC context, consultation popup,
   CTA preselection, scroll reveal, lazy image fade, FAQ accordion,
   mobile sticky bar, and placeholder lead-form handling.
   ========================================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LEAD_EVENT = 'sabinsky:lead';
  var TREATMENT_VALUES = { invisalign: 'Invisalign', braces: 'Braces' };
  var LOCATION_VALUES = { princeton: 'Princeton', hillsborough: 'Hillsborough' };

  var dialog = document.getElementById('consult-dialog');
  var inlineSlot = document.getElementById('lead-form-slot');
  var dialogSlot = document.getElementById('dialog-form-slot');

  function allForms() {
    return Array.prototype.slice.call(document.querySelectorAll('form.lead-form'));
  }

  /* ------------------------------------------------------------------
     1. Popup: clone the inline form (or GHL embed) into the <dialog>
     ------------------------------------------------------------------ */
  function cloneFormIntoDialog() {
    if (!inlineSlot || !dialogSlot) { return; }
    dialogSlot.innerHTML = inlineSlot.innerHTML;

    /* Prefix ids/for/aria references so both copies stay valid HTML */
    var PREFIX = 'modal-';
    Array.prototype.forEach.call(dialogSlot.querySelectorAll('[id]'), function (el) {
      el.id = PREFIX + el.id;
    });
    Array.prototype.forEach.call(dialogSlot.querySelectorAll('label[for]'), function (el) {
      el.setAttribute('for', PREFIX + el.getAttribute('for'));
    });
    ['aria-controls', 'aria-labelledby', 'aria-describedby'].forEach(function (attr) {
      Array.prototype.forEach.call(dialogSlot.querySelectorAll('[' + attr + ']'), function (el) {
        el.setAttribute(attr, el.getAttribute(attr).split(/\s+/).map(function (v) { return PREFIX + v; }).join(' '));
      });
    });

    /* Re-execute any <script> tags pasted with a third-party embed */
    Array.prototype.forEach.call(dialogSlot.querySelectorAll('script'), function (old) {
      var s = document.createElement('script');
      Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  /* ------------------------------------------------------------------
     2. Google Ads / PPC attribution → hidden fields (every form copy)
     ------------------------------------------------------------------ */
  function captureAttribution() {
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('sabinsky_attr') || '{}'); } catch (e) { stored = {}; }

    keys.forEach(function (key) {
      var value = params.get(key) || stored[key] || '';
      if (value) { stored[key] = value; }
    });
    try { sessionStorage.setItem('sabinsky_attr', JSON.stringify(stored)); } catch (e) { /* storage unavailable */ }

    allForms().forEach(function (form) {
      keys.forEach(function (key) {
        var input = form.querySelector('input[name="' + key + '"]');
        if (input) { input.value = stored[key] || ''; }
      });
      var pageUrl = form.querySelector('input[name="page_url"]');
      if (pageUrl) { pageUrl.value = window.location.href.slice(0, 500); }
      var ref = form.querySelector('input[name="referrer"]');
      if (ref) { ref.value = document.referrer.slice(0, 500); }
    });
  }

  /* ------------------------------------------------------------------
     3. Smart PPC personalization (one page, context-aware ordering)
     ------------------------------------------------------------------ */
  function detectTreatmentContext() {
    var explicit = (params.get('treatment') || '').toLowerCase();
    if (explicit === 'invisalign' || explicit === 'braces') { return explicit; }

    var signal = [params.get('utm_campaign'), params.get('utm_term'), params.get('utm_content')]
      .filter(Boolean).join(' ').toLowerCase();
    if (!signal) { return 'balanced'; }

    var isInvisalign = /invisalign|aligner|invisible/.test(signal);
    var isBraces = /braces|bracket/.test(signal);
    if (isInvisalign && !isBraces) { return 'invisalign'; }
    if (isBraces && !isInvisalign) { return 'braces'; }
    return 'balanced';
  }

  function setTreatmentInterest(value) {
    if (!value) { return; }
    allForms().forEach(function (form) {
      var radio = form.querySelector('input[name="treatment_interest"][value="' + value + '"]');
      if (radio) { radio.checked = true; }
    });
  }

  function setPreferredLocation(value) {
    if (!value) { return; }
    allForms().forEach(function (form) {
      var select = form.querySelector('select[name="preferred_location"]');
      if (!select) { return; }
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === value.toLowerCase()) { select.selectedIndex = i; break; }
      }
    });
  }

  function applyTreatmentContext() {
    var context = detectTreatmentContext();
    document.documentElement.setAttribute('data-treatment-context', context);
    if (context === 'invisalign') { setTreatmentInterest('Invisalign'); }
    if (context === 'braces') { setTreatmentInterest('Braces'); }

    var loc = (params.get('location') || '').toLowerCase();
    if (loc === 'princeton' || loc === 'hillsborough') { setPreferredLocation(loc); }
  }

  /* ------------------------------------------------------------------
     4. Consultation popup open / close
     ------------------------------------------------------------------ */
  var lastTrigger = null;

  function focusFirstEmptyField(scope) {
    var fields = scope.querySelectorAll('input[type="text"]:not(.hp), input[type="tel"], input[type="email"]');
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].value) {
        try { fields[i].focus({ preventScroll: true }); } catch (e) { fields[i].focus(); }
        return;
      }
    }
  }

  function scrollToInlineForm() {
    var section = document.getElementById('consultation');
    if (!section) { return; }
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(function () { focusFirstEmptyField(section); }, reduceMotion ? 0 : 500);
  }

  function openDialog(trigger) {
    if (!dialog || typeof dialog.showModal !== 'function') { scrollToInlineForm(); return; }
    lastTrigger = trigger || null;
    if (!dialog.open) { dialog.showModal(); }
    document.body.classList.add('dialog-open');
    var panel = dialog.querySelector('.dialog-panel');
    if (panel) { panel.scrollTop = 0; }
    window.setTimeout(function () { focusFirstEmptyField(dialog); }, 60);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'consult_popup_open', cta_id: trigger && trigger.id ? trigger.id : '' });
  }

  function closeDialog() {
    if (!dialog || !dialog.open) { return; }
    dialog.close();
  }

  function initDialog() {
    if (!dialog) { return; }
    var closeBtn = document.getElementById('dialog-close');
    if (closeBtn) { closeBtn.addEventListener('click', closeDialog); }

    /* Click on the backdrop (outside the panel) closes */
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { closeDialog(); }
    });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('dialog-open');
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        try { lastTrigger.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }
    });
  }

  function bindFormCtas() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-open-form]'), function (cta) {
      cta.addEventListener('click', function (event) {
        event.preventDefault();
        var treatment = cta.getAttribute('data-treatment');
        var location = cta.getAttribute('data-location');
        if (treatment && TREATMENT_VALUES[treatment]) { setTreatmentInterest(TREATMENT_VALUES[treatment]); }
        if (location && LOCATION_VALUES[location]) { setPreferredLocation(LOCATION_VALUES[location]); }
        openDialog(cta);
      });
    });
  }

  /* ------------------------------------------------------------------
     5. Smooth in-page scrolling for plain anchor links
     ------------------------------------------------------------------ */
  function initSmoothAnchors() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link || link.hasAttribute('data-open-form')) { return; }
      var id = link.getAttribute('href').slice(1);
      if (!id) { return; }
      var target = document.getElementById(id);
      if (!target) { return; }
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) { history.replaceState(null, '', '#' + id); }
    });
  }

  /* ------------------------------------------------------------------
     6. Scroll reveal + lazy image fade-in
     ------------------------------------------------------------------ */
  var REVEAL_SELECTOR = [
    '.section-head', '.offer-card', '.total-bar', '.trust-list', '.assoc-logos',
    '.treatment-card', '.detail-media', '.detail-copy', '.why-card', '.transform-card', '.cta-band-inner',
    '.testimonial-card', '.doctor-media', '.doctor-copy', '.accordion', '.faq-cta', '.form-section-copy',
    '.form-card', '.location-card', '.final-inner'
  ].join(',');

  function initReveal() {
    var items = document.querySelectorAll(REVEAL_SELECTOR);
    if (!items.length) { return; }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-visible'); });
      return;
    }
    /* Stagger siblings inside the same parent */
    Array.prototype.forEach.call(items, function (el) {
      el.classList.add('reveal');
      var siblings = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); }) : [];
      var index = siblings.indexOf(el);
      if (index > 0) { el.style.transitionDelay = Math.min(index * 90, 360) + 'ms'; }
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  function initLazyImages() {
    Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (img) {
      img.classList.add('lazy-img');
      var done = function () { img.classList.add('is-loaded'); };
      if (img.complete && img.naturalWidth > 0) { done(); return; }
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  /* ------------------------------------------------------------------
     7. FAQ accordion (accessible, keyboard-friendly)
     ------------------------------------------------------------------ */
  function initAccordion() {
    var root = document.getElementById('faq-accordion');
    if (!root) { return; }
    var triggers = Array.prototype.slice.call(root.querySelectorAll('.acc-trigger'));

    function setOpen(trigger, open) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!panel) { return; }
      if (open) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); }
    }

    triggers.forEach(function (trigger, index) {
      trigger.addEventListener('click', function () {
        setOpen(trigger, trigger.getAttribute('aria-expanded') !== 'true');
      });
      trigger.addEventListener('keydown', function (event) {
        var next;
        switch (event.key) {
          case 'ArrowDown': next = triggers[(index + 1) % triggers.length]; break;
          case 'ArrowUp': next = triggers[(index - 1 + triggers.length) % triggers.length]; break;
          case 'Home': next = triggers[0]; break;
          case 'End': next = triggers[triggers.length - 1]; break;
          default: return;
        }
        event.preventDefault();
        next.focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     8. Mobile sticky bar: hide while the inline form is on screen
     ------------------------------------------------------------------ */
  function initMobileBar() {
    var bar = document.getElementById('mobile-bar');
    var inlineForm = inlineSlot;
    if (!bar || !inlineForm || !('IntersectionObserver' in window)) { return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle('is-hidden', entry.isIntersecting && entry.intersectionRatio > 0.2);
      });
    }, { threshold: [0, 0.2, 0.5] });
    observer.observe(inlineForm);
  }

  /* ------------------------------------------------------------------
     9. Placeholder lead form: validation + submission (never fakes success)
        Replace the markup inside #lead-form-slot with the GHL embed later.
     ------------------------------------------------------------------ */
  function fieldWrapper(el) {
    return el.closest('.field') || el.closest('fieldset');
  }

  function ensureErrorNode(wrapper, message) {
    if (!wrapper) { return; }
    var node = wrapper.querySelector('.field-error');
    if (!node) {
      node = document.createElement('p');
      node.className = 'field-error';
      wrapper.appendChild(node);
    }
    node.textContent = message;
  }

  function validateForm(form) {
    var valid = true;
    var firstInvalid = null;
    Array.prototype.forEach.call(form.querySelectorAll('.field, fieldset.field'), function (w) { w.classList.remove('invalid'); });

    var seenRadioGroups = {};
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      var wrapper = fieldWrapper(el);
      var ok = true;
      var message = 'This field is required.';

      if (el.type === 'radio') {
        if (seenRadioGroups[el.name]) { return; }
        seenRadioGroups[el.name] = true;
        ok = !!form.querySelector('input[name="' + el.name + '"]:checked');
        message = 'Please choose a treatment interest.';
      } else if (el.type === 'checkbox') {
        ok = el.checked;
        message = 'Please agree to continue.';
      } else if (el.type === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        message = 'Please enter a valid email address.';
      } else if (el.type === 'tel') {
        ok = el.value.replace(/\D/g, '').length >= 10;
        message = 'Please enter a valid phone number.';
      } else {
        ok = el.value.trim().length > 0;
        if (el.tagName === 'SELECT') { message = 'Please make a selection.'; }
      }

      if (!ok) {
        valid = false;
        if (wrapper) { wrapper.classList.add('invalid'); ensureErrorNode(wrapper, message); }
        if (!firstInvalid) { firstInvalid = el; }
      }
    });

    if (firstInvalid) {
      try { firstInvalid.focus({ preventScroll: false }); } catch (e) { firstInvalid.focus(); }
    }
    return valid;
  }

  function setStatus(form, type, text) {
    var status = form.querySelector('.form-status');
    if (!status) { return; }
    status.className = 'form-status' + (type ? ' ' + type : '');
    status.textContent = text || '';
  }

  function fireLeadConversion(form, payload) {
    /* Fires ONLY after a verified successful submission response. */
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'generate_lead',
      lead_source: 'sabinsky-orthodontics-offer',
      treatment_interest: payload.treatment_interest || '',
      preferred_location: payload.preferred_location || ''
    });
    var sendTo = form.getAttribute('data-conversion-send-to');
    if (sendTo && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: sendTo });
    }
    document.dispatchEvent(new CustomEvent(LEAD_EVENT, { detail: payload }));
  }

  function showSuccess(form, payload) {
    form.setAttribute('aria-busy', 'false');
    form.innerHTML =
      '<div class="form-success" role="status" aria-live="polite" tabindex="-1">' +
        '<div class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg></div>' +
        '<h3 class="form-title">Thank You! Your Request Is In.</h3>' +
        '<p>Our team will contact you shortly to schedule your free consultation' +
        (payload.preferred_location ? ' in ' + payload.preferred_location : '') + '.</p>' +
        '<p>Prefer to talk now? <a href="tel:6402033896" data-conversion-type="phone">Call (640) 203-3896</a></p>' +
      '</div>';
    var node = form.querySelector('.form-success');
    if (node) { node.focus(); }
    var thankYou = form.getAttribute('data-thank-you-url');
    if (thankYou) { window.setTimeout(function () { window.location.assign(thankYou); }, 600); }
  }

  function initForms() {
    document.addEventListener('input', clearInvalid);
    document.addEventListener('change', clearInvalid);
    function clearInvalid(event) {
      if (!event.target.closest || !event.target.closest('form.lead-form')) { return; }
      var wrapper = fieldWrapper(event.target);
      if (wrapper && wrapper.classList.contains('invalid')) { wrapper.classList.remove('invalid'); }
    }

    document.addEventListener('submit', function (event) {
      var form = event.target.closest ? event.target.closest('form.lead-form') : null;
      if (!form) { return; }
      event.preventDefault();
      setStatus(form, '', '');
      if (!validateForm(form)) {
        setStatus(form, 'error', 'Please complete the highlighted fields.');
        return;
      }

      var honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) { return; }

      var endpoint = form.getAttribute('data-endpoint') || form.getAttribute('action');
      if (!endpoint) {
        /* PLACEHOLDER: the live GHL form replaces this markup; no lead is faked. */
        console.warn('[Sabinsky LP] Placeholder form: no endpoint configured. Replace #lead-form-slot with the GHL embed.');
        setStatus(form, 'info', 'This is a placeholder form. The live booking form will be connected here. To claim your $1,025 offer today, call (640) 203-3896.');
        return;
      }

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      form.setAttribute('aria-busy', 'true');
      setStatus(form, 'info', 'Sending your request…');

      fetch(endpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
        .then(function (response) {
          if (!response.ok) { throw new Error('HTTP ' + response.status); }
          return response;
        })
        .then(function () {
          fireLeadConversion(form, payload);
          showSuccess(form, payload);
        })
        .catch(function (error) {
          console.error('[Sabinsky LP] Form submission failed:', error);
          form.setAttribute('aria-busy', 'false');
          setStatus(form, 'error', 'We could not send your request. Please try again or call (640) 203-3896.');
        });
    });
  }

  /* ------------------------------------------------------------------
     10. Lightweight click tracking hooks (dataLayer only; no vendor code)
     ------------------------------------------------------------------ */
  function initClickTracking() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest('[data-conversion-type]');
      if (!el) { return; }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: el.getAttribute('data-conversion-type') === 'phone' ? 'phone_click' : 'cta_click',
        cta_id: el.id || '',
        treatment: el.getAttribute('data-treatment') || '',
        location: el.getAttribute('data-location') || ''
      });
    });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  cloneFormIntoDialog();
  captureAttribution();
  applyTreatmentContext();
  initDialog();
  bindFormCtas();
  initSmoothAnchors();
  initReveal();
  initLazyImages();
  initAccordion();
  initMobileBar();
  initForms();
  initClickTracking();
})();
