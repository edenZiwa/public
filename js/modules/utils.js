/* =====================================================
   COMPONENT LOADER
   Security-focused component loading
===================================================== */

/**
 * Load one of the application's trusted HTML components.
 *
 * Only predefined component names are accepted.
 */

const COMPONENTS = Object.freeze({
  header: "./components/header.html",
  footer: "./components/footer.html"
});



export async function loadComponent(selector, componentName) {
  const container = document.querySelector(selector);

  if (!container) return;

  const url = COMPONENTS[componentName];

  if (!url) {
    console.error("Unknown component:", componentName);
    return;
  }

  // Save fallback markup already present in the HTML.
  const fallback = container.innerHTML;

  let controller = null;
  let timeoutId = null;

  try {
    // AbortController is optional for compatibility.
    if (typeof AbortController !== "undefined") {
      controller = new AbortController();

      timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000);
    }

    const options = {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "text/html" }
    };

    if (controller) {
      options.signal = controller.signal;
    }

    // Use the browser's normal caching and redirect behavior.
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("Invalid component content type.");
    }

    const html = await response.text();

    // Check size where TextEncoder is available.
    if (
      typeof TextEncoder !== "undefined" &&
      new TextEncoder().encode(html).length > 250 * 1024
    ) {
      throw new Error("Component is too large.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (doc.querySelector("script, iframe, object, embed")) {
      throw new Error("Unsafe component content.");
    }

    container.replaceChildren(
      ...Array.from(doc.body.childNodes)
    );

  } catch (error) {
    console.error(`Failed to load ${componentName}:`, error);

    // Preserve existing fallback markup.
    if (fallback && !container.hasChildNodes()) {
      container.innerHTML = fallback;
    }

  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}



/* =====================================================
   ACTIVE NAVIGATION
===================================================== */

export function setActiveNavigation() {

  const currentPage =
    normalizePath(
      window.location.pathname
    );


  document
    .querySelectorAll(
      "[data-nav]"
    )
    .forEach((link) => {

      const href =
        link.getAttribute("href");

      if (!href) {
        return;
      }


      /*
       * Ignore:
       *
       * #anchors
       * javascript:
       * mailto:
       * tel:
       */
      if (
        href.startsWith("#") ||
        /^(javascript:|mailto:|tel:)/i.test(href)
      ) {

        return;
      }


      let linkURL;

      try {

        linkURL =
          new URL(
            href,
            window.location.href
          );

      } catch {

        return;
      }


      /*
       * Only compare same-origin pages.
       */
      if (
        linkURL.origin !==
        window.location.origin
      ) {

        return;
      }


      const page =
        normalizePath(
          linkURL.pathname
        );


      const isActive =
        page === currentPage;


      link.classList.toggle(
        "active",
        isActive
      );


      if (isActive) {

        link.setAttribute(
          "aria-current",
          "page"
        );

      } else {

        link.removeAttribute(
          "aria-current"
        );

      }

    });

}


/* =====================================================
   PATH NORMALIZATION
===================================================== */

function normalizePath(path) {

  if (!path) {
    return "/";
  }


  /*
   * Remove trailing slash.
   */
  path =
    path.replace(
      /\/+$/,
      ""
    ) || "/";


  /*
   * Treat / as index.html.
   */
  if (path === "/") {
    return "/index.html";
  }


  /*
   * Treat /about/ and /about.html
   * consistently where appropriate.
   */
  if (
    path.endsWith("/")
  ) {

    path += "index.html";

  }


  return path
    .toLowerCase();

}


/* =====================================================
   CURRENT YEAR
===================================================== */

export function updateCurrentYear() {

  const currentYear =
    String(
      new Date()
        .getFullYear()
    );


  document
    .querySelectorAll(
      "[data-current-year]"
    )
    .forEach((element) => {

      element.textContent =
        currentYear;

    });

}


/* =====================================================
   FORM VALIDATION
===================================================== */

export function initializeForms() {

  document
    .querySelectorAll("form")
    .forEach((form) => {

      /*
       * Prevent duplicate listeners
       * if initialization runs more than once.
       */
      if (
        form.dataset.validationInitialized ===
        "true"
      ) {

        return;
      }


      form.dataset.validationInitialized =
        "true";


      form.addEventListener(
        "submit",
        (event) => {

          if (!form.checkValidity()) {

            event.preventDefault();
            event.stopPropagation();

          }


          form.classList.add(
            "was-validated"
          );

        }
      );

    });

     }
