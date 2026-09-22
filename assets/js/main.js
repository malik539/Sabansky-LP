/* ==========================================================================
   Sabinsky Orthodontics — $1,025 Savings PPC Landing Page
   Vanilla JS: attribution capture, PPC context, CTA preselection,
   FAQ accordion, mobile sticky bar, and lead-form submission.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('consult-form');
  var params = new URLSearchParams(window.location.search);
  var LEAD_EVENT = 'sabinsky:lead';

  /* ------------------------------------------------------------------
     1. Google Ads / PPC attribution → hidden fields
     ------------------------------------------------------------------ */
  function captureAttribution() {
    if (!form) { return; }
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('sabinsky_attr') || '{}'); } catch (e) { stored = {}; }

    keys.forEach(function (key) {
      var value = params.get(key) || stored[key] || '';
      if (value) { stored[key] = value; }
      var input = form.querySelector('input[name="' + key + '"]');
      if (input) { input.value = value; }
    });

    try { sessionStorage.setItem('sabinsky_attr', JSON.stringify(stored)); } catch (e) { /* storage unavailable */ }

    var pageUrl = form.querySelector('input[name="page_url"]');
    if (pageUrl) { pageUrl.value = window.location.href.slice(0, 500); }
    var ref = form.querySelector('input[name="referrer"]');
    if (ref) { ref.value = document.referrer.slice(0, 500); }
  }

  /* ------------------------------------------------------------------
     2. Smart PPC personalization (one page, context-aware ordering)
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
    if (!form || !value) { return; }
    var radio = form.querySelector('input[name="treatment_interest"][value="' + value + '"]');
    if (radio) { radio.checked = true; }
  }

  function setPreferredLocation(value) {
    if (!form || !value) { return; }
    var select = form.querySelector('select[name="preferred_location"]');
    if (!select) { return; }
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value.toLowerCase() === value.toLowerCase()) {
        select.selectedIndex = i;
        break;
      }
    }
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
     3. CTA → scroll to form + preselect treatment / location
     ------------------------------------------------------------------ */
  var TREATMENT_VALUES = { invisalign: 'Invisalign', braces: 'Braces' };
  var LOCATION_VALUES = { princeton: 'Princeton', hillsborough: 'Hillsborough' };

  function focusFirstEmptyField() {
    if (!form) { return; }
    var fields = form.querySelectorAll('input[type="text"]:not(.hp), input[type="tel"], input[type="email"]');
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].value) {
        try { fields[i].focus({ preventScroll: true }); } catch (e) { fields[i].focus(); }
        return;
      }
    }
  }

  function scrollToForm() {
    if (!form) { return; }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(focusFirstEmptyField, reduce ? 0 : 450);
  }

  function bindFormCtas() {
    var ctas = document.querySelectorAll('[data-scroll-form]');
    Array.prototype.forEach.call(ctas, function (cta) {
      cta.addEventListener('click', function (event) {
        if (!form) { return; }
        event.preventDefault();
        var treatment = cta.getAttribute('data-treatment');
        var location = cta.getAttribute('data-location');
        if (treatment && TREATMENT_VALUES[treatment]) { setTreatmentInterest(TREATMENT_VALUES[treatment]); }
        if (location && LOCATION_VALUES[location]) { setPreferredLocation(LOCATION_VALUES[location]); }
        scrollToForm();
      });
    });
  }

  /* ------------------------------------------------------------------
     4. FAQ accordion (accessible, keyboard-friendly)
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
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        setOpen(trigger, !isOpen);
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
     5. Mobile sticky bar: hide while the form itself is on screen
     ------------------------------------------------------------------ */
  function initMobileBar() {
    var bar = document.getElementById('mobile-bar');
    if (!bar || !form || !('IntersectionObserver' in window)) { return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle('is-hidden', entry.isIntersecting && entry.intersectionRatio > 0.25);
      });
    }, { threshold: [0, 0.25, 0.5] });
    observer.observe(form);
  }

  /* ------------------------------------------------------------------
     6. Lead form: validation + submission (never fakes success)
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

  function validateForm() {
    var valid = true;
    var firstInvalid = null;

    Array.prototype.forEach.call(form.querySelectorAll('.field, fieldset.field'), function (w) { w.classList.remove('invalid'); });

    var required = form.querySelectorAll('[required]');
    var seenRadioGroups = {};
    Array.prototype.forEach.call(required, function (el) {
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
        if (!firstInvalid) { firstInvalid = el.type === 'radio' ? el : el; }
      }
    });

    if (firstInvalid) {
      try { firstInvalid.focus({ preventScroll: false }); } catch (e) { firstInvalid.focus(); }
    }
    return valid;
  }

  function setStatus(type, text) {
    var status = document.getElementById('form-status');
    if (!status) { return; }
    status.className = 'form-status' + (type ? ' ' + type : '');
    status.textContent = text || '';
  }

  function fireLeadConversion(payload) {
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

  function showSuccess(payload) {
    form.setAttribute('aria-busy', 'false');
    form.innerHTML =
      '<div class="form-success" role="status" aria-live="polite" tabindex="-1">' +
        '<div class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg></div>' +
        '<h2>Thank You! Your Request Is In.</h2>' +
        '<p>Our team will contact you shortly to schedule your free consultation' +
        (payload.preferred_location ? ' in ' + payload.preferred_location : '') + '.</p>' +
        '<p>Prefer to talk now? <a href="tel:6402033896" id="success-call" data-conversion-type="phone">Call (640) 203-3896</a></p>' +
      '</div>';
    var node = form.querySelector('.form-success');
    if (node) { node.focus(); }
    var thankYou = form.getAttribute('data-thank-you-url');
    if (thankYou) { window.setTimeout(function () { window.location.assign(thankYou); }, 600); }
  }

  function initForm() {
    if (!form) { return; }

    form.addEventListener('input', function (event) {
      var wrapper = fieldWrapper(event.target);
      if (wrapper && wrapper.classList.contains('invalid')) { wrapper.classList.remove('invalid'); }
    });
    form.addEventListener('change', function (event) {
      var wrapper = fieldWrapper(event.target);
      if (wrapper && wrapper.classList.contains('invalid')) { wrapper.classList.remove('invalid'); }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('', '');
      if (!validateForm()) {
        setStatus('error', 'Please complete the highlighted fields.');
        return;
      }

      var honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) { return; }

      var endpoint = form.getAttribute('data-endpoint') || form.getAttribute('action');
      if (!endpoint) {
        /* CONNECT EXISTING SABINSKY ORTHODONTICS FORM ENDPOINT HERE (index.html → data-endpoint). */
        console.warn('[Sabinsky LP] No form endpoint configured. Set data-endpoint on #consult-form.');
        setStatus('error', 'Our online form is not available right now. Please call (640) 203-3896 to claim your $1,025 offer.');
        return;
      }

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      form.setAttribute('aria-busy', 'true');
      setStatus('info', 'Sending your request…');

      fetch(endpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
        .then(function (response) {
          if (!response.ok) { throw new Error('HTTP ' + response.status); }
          return response;
        })
        .then(function () {
          fireLeadConversion(payload);
          showSuccess(payload);
        })
        .catch(function (error) {
          console.error('[Sabinsky LP] Form submission failed:', error);
          form.setAttribute('aria-busy', 'false');
          setStatus('error', 'We could not send your request. Please try again or call (640) 203-3896.');
        });
    });
  }

  /* ------------------------------------------------------------------
     7. Lightweight click tracking hooks (dataLayer only; no vendor code)
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
  captureAttribution();
  applyTreatmentContext();
  bindFormCtas();
  initAccordion();
  initMobileBar();
  initForm();
  initClickTracking();
})();
