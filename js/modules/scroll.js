const button = document.getElementById("scrollButton");
const link = document.getElementById("scrollLink");
const chev = document.getElementById("chevron");

const header = document.getElementById("site-header");
const footer = document.getElementById("site-footer");

function pageScrollChevron() {
    if (!button || !link || !chev) return;

    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    const atTop = scrollTop <= 50;

    const atBottom =
    scrollTop + viewportHeight >= pageHeight - 50;


    /*
         * Hide button when at the very top.
         */
    if (atTop) {

        button.classList.remove("show");

        chev.className = "bi bi-chevron-down";

        if (footer) {
            link.href = "#site-footer";
        }

        link.setAttribute(
            "aria-label",
            "Scroll to bottom"
        );

        return;
    }


    /*
         * Show button after leaving the top.
         */
    button.classList.add("show");


    /*
         * At bottom → point UP.
         */
    if (atBottom) {

        chev.className = "bi bi-chevron-up";

        if (header) {
            link.href = "#site-header";
        }

        link.setAttribute(
            "aria-label",
            "Scroll to top"
        );

    }

    /*
         * Anywhere else → point UP.
         */
    else {

        chev.className = "bi bi-chevron-up";

        if (header) {
            link.href = "#site-header";
        }

        link.setAttribute(
            "aria-label",
            "Scroll to top"
        );
    }
}

export function setScroll() {
    if (!button || !link || !chev) return;

    /*
     * Smooth scrolling
     */
    link.addEventListener("click", function (event) {

        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });


    /*
     * Detect scrolling
     */
    window.addEventListener(
        "scroll",
        pageScrollChevron,
        {
            passive: true
        }
    );


    /*
     * Detect screen resizing
     */
    window.addEventListener(
        "resize",
        pageScrollChevron
    );


    /*
     * Initial state
     */
    pageScrollChevron();

};