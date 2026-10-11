import {
    setScroll
} from "./modules/scroll.js";
import {
    initializeForms,
    updateCurrentYear,
    setActiveNavigation,
    loadComponent
} from "./modules/utils.js";

function detectTheme() {
    const root = document.documentElement;
    const media = window.matchMedia(
        '(prefers-color-scheme: dark)'
    );

    const applySystemTheme = () => {
        root.dataset.bsTheme = media.matches
        ? 'dark': 'light';
    };

    applySystemTheme();

    media.addEventListener(
        'change',
        applySystemTheme
    );
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await Promise.all([

            loadComponent(
                "#site-header",
                "header"
            ),

            loadComponent(
                "#site-footer",
                "footer"
            )
        ]);
        detectTheme();

        setScroll();

        setActiveNavigation();

        updateCurrentYear();

        initializeForms();

        console.log("App loaded");
    }


);