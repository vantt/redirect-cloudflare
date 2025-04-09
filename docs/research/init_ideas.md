# URL Redirect Solution: Current Implementation and Future Improvements

## Key Requirements

This is a centralized redirect tool with the following critical requirements:

1. **Centralized Tracking Hub**: The tool must handle all tracking (GTM/GA4) independently before any redirection occurs
2. **Self-Contained Tracking**: Tracking must be completed within the tool itself, not relying on destination pages
3. **Single Point of Control**: As the hub for all system redirects, the tool must maintain consistent tracking across all redirects

## Current Implementation Overview

The current URL redirect solution is built using pure HTML and JavaScript. This implementation was chosen for its simplicity and direct integration capabilities with Google Tag Manager (GTM) and Google Analytics 4 (GA4) tracking.

### Key Features
- Client-side redirection using JavaScript
- Built-in GTM and GA4 tracking integration
- Simple and lightweight implementation
- Easy to deploy and maintain

### Technical Implementation
```html
<!DOCTYPE html>
<html lang="en-gb">
  <!-- Google Tag Manager -->
  <script>
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-MCL8HKQ");
  </script>
  <!-- End Google Tag Manager -->

  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="Description"
      content="This page will redirect to another destination url"
    />
    <link rel="shortcut icon" href="logo.ico" type="image/x-icon" />
    <link rel="icon" href="logo.ico" type="image/x-icon" />
    <title>Fine Japan Vietnam</title>
  </head>

  <body>
    <!-- Google Tag Manager (noscript) -->
    <noscript
      ><iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-MCL8HKQ"
        height="0"
        width="0"
        style="display: none; visibility: hidden"
      ></iframe
    ></noscript>
    <!-- End Google Tag Manager (noscript) -->
  </body>

  <script>
    // get redirect url (part after #)
    var path = window.location.href;
    var hashInd = path.indexOf("#");
    var redirectUrl = path.slice(hashInd + 1);

    // get isNoRedirect value (0 or 1): https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
    var queryParams = new URLSearchParams(window.location.search);
    var isNoRedirect = queryParams.get("isNoRedirect");
    var isRedirect = !Boolean(parseInt(isNoRedirect));

    setTimeout(function () {
      var newLocation = redirectUrl;

      if (isRedirect && newLocation !== "") {
        window.location.href = newLocation;
      }
    }, 200);
  </script>
</html>
```

## Current Limitations

1. **Client-side Redirection**: The current implementation uses client-side JavaScript for redirection, which:
   - Is not SEO-friendly as search engines may not properly index the destination URLs
   - May cause a brief flash of content before redirection
   - Relies on JavaScript being enabled in the user's browser

2. **Performance Impact**: The 200ms delay before redirection may affect user experience and page load metrics.

## Goals for Improvement

1. **Server-side Redirection**: Implement server-side redirects to:
   - Improve SEO performance
   - Provide faster redirection
   - Ensure reliability regardless of client-side JavaScript
   - Maintain centralized tracking control

2. **Independent Tracking System**: Develop a robust tracking solution that:
   - Completes all tracking before redirection
   - Functions independently of destination pages
   - Maintains existing GTM and GA4 integration
   - Ensures consistent tracking across all redirects

3. **Enhanced User Experience**: Reduce or eliminate the delay in redirection while maintaining tracking accuracy.

## Next Steps

1. Research and implement server-side redirect solutions
2. Develop a strategy to maintain tracking capabilities
3. Test and optimize the new implementation
4. Create documentation for the improved solution

