# Sabinsky Orthodontics — $1,025 Savings PPC Landing Page

Single-page Google Ads landing page for the **$650 off Invisalign® or braces + FREE teeth whitening ($250) + FREE consultation ($125) = $1,025 total savings** campaign.

Built with plain HTML5, CSS3 and a small vanilla JavaScript file. No frameworks, no build step.

```
index.html              # the landing page
assets/css/styles.css   # brand tokens (from the logo) + layout
assets/js/main.js       # attribution capture, PPC context, CTA preselection, FAQ accordion, sticky bar, form
assets/img/             # supplied logo, doctor photo, approved campaign imagery (optimized WebP + fallbacks)
```

## Connect the lead form

The form (`#consult-form`) is **not wired to a backend yet** and will never fake a success.
Search `index.html` for `CONNECT EXISTING SABINSKY ORTHODONTICS FORM ENDPOINT HERE` and set:

| Attribute on `#consult-form` | Purpose |
| --- | --- |
| `data-endpoint` (or `action`) | POST target that accepts `multipart/form-data`. A 2xx response = success. |
| `data-thank-you-url` | Optional redirect after a verified success. |
| `data-conversion-send-to` | Optional Google Ads `AW-XXXX/XXXX` label; `gtag('event','conversion')` fires only after a 2xx response. |

Until an endpoint is set, submitting shows a message asking the visitor to call (640) 203-3896.

### Fields posted

`first_name`, `last_name`, `phone`, `email`, `treatment_interest` (Invisalign / Braces / Not Sure Yet), `preferred_location` (Princeton / Hillsborough), `hear_about`, `message`, `consent`, plus hidden attribution: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `gbraid`, `wbraid`, `landing_page=sabinsky-orthodontics-offer`, `offer`, `page_url`, `referrer`. `website` is a honeypot and must stay empty.

## Tracking hooks

* Every CTA has a unique `id` and `data-conversion-type="lead|phone"` (plus `data-treatment` / `data-location` where relevant).
* Clicks push `cta_click` / `phone_click` to `window.dataLayer`.
* A verified submission pushes `generate_lead` to `dataLayer` and dispatches a `sabinsky:lead` DOM event. **Nothing fires on a mere submit click.**

## PPC personalization (one page)

`utm_campaign`, `utm_term` or `utm_content` containing *invisalign / aligner* → Invisalign card first, Invisalign preselected, `<html data-treatment-context="invisalign">`.
Containing *braces / bracket* → Braces card and section first, Braces preselected, `data-treatment-context="braces"`.
Otherwise the balanced default. `?treatment=braces|invisalign` and `?location=princeton|hillsborough` are also honoured.

## Local preview

```
python3 -m http.server 8080
# open http://localhost:8080/
```
