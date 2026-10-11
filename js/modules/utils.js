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
  header: "components/header.html",
  footer: "components/footer.html"
});


export async function loadComponent(
  selector,
  componentName
) {

  const container =
    document.querySelector(selector);

  if (!container) {
    return;
  }


  /*
   * Only allow known components.
   */
  const url =
    COMPONENTS[componentName];

  if (!url) {

    console.error(
      "Unknown component:",
      componentName
    );

    return;
  }


  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      10000
    );


  try {

    const response =
      await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        headers: {
          "Accept": "text/html"
        },
        signal: controller.signal
      });


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (
      !contentType
        .toLowerCase()
        .includes("text/html")
    ) {

      throw new Error(
        "Invalid component content type."
      );

    }


    const html =
      await response.text();


    /*
     * Prevent unexpectedly large responses.
     */
    if (
      new TextEncoder()
        .encode(html)
        .length >
      250 * 1024
    ) {

      throw new Error(
        "Component is too large."
      );

    }


    /*
     * Parse as inert HTML.
     */
    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        html,
        "text/html"
      );


    /*
     * Components must not contain scripts.
     */
    if (
      doc.querySelector(
        "script, iframe, object, embed"
      )
    ) {

      throw new Error(
        "Unsafe component content."
      );

    }


    /*
     * Insert only the component body.
     */
    container.replaceChildren(
      ...Array.from(
        doc.body.childNodes
      )
    );


  } catch (error) {

    console.error(
      `Failed to load ${componentName}:`,
      error
    );

  } finally {

    clearTimeout(timeout);

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
