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

async function initializeGoogleSignIn() {
    const buttonHost = document.getElementById("googleSignInButton");
    const accountLink = document.getElementById("publicAccountLink");
    if (!buttonHost) return;

    let currentSession = null;
    try {
        const response = await fetch("/auth/me", {
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });
        if (response.ok) currentSession = await response.json();
    } catch (error) {
        console.warn("Unable to check current sign-in status.");
    }

    if (currentSession?.authenticated) {
        buttonHost.classList.add("d-none");
        if ((currentSession.roles || []).includes("public_user")) {
            accountLink?.classList.remove("d-none");
        } else if ((currentSession.roles || []).some(role =>
            ["super_admin", "admin", "staff", "finance", "programs", "volunteers", "communications"].includes(role)
        )) {
            const staffLink = document.createElement("a");
            staffLink.className = "btn btn-outline-success btn-sm mt-2";
            staffLink.href = "/admin";
            staffLink.textContent = "Staff portal";
            buttonHost.replaceWith(staffLink);
        }
        return;
    }

    let config;
    try {
        const response = await fetch("/auth/google-config", {
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });
        config = await response.json();
    } catch {
        return;
    }
    if (!config?.clientId) {
        // The public site remains usable while Google OAuth is being configured.
        buttonHost.innerHTML = '<span class="small text-secondary">Google sign-in is being configured</span>';
        return;
    }

    const loadGoogleScript = () => new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();
        const existing = document.querySelector('script[data-google-identity="true"]');
        if (existing) {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    const handleCredential = async (response) => {
        if (!response?.credential) return;
        buttonHost.setAttribute("aria-busy", "true");
        try {
            const result = await fetch("/auth/google", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await result.json().catch(() => ({}));
            if (!result.ok) {
                let message = document.getElementById("googleSignInStatus");
                if (!message) {
                    message = document.createElement("p");
                    message.id = "googleSignInStatus";
                    message.className = "small text-danger mt-2";
                    buttonHost.insertAdjacentElement("afterend", message);
                }
                message.textContent = data.error || "Google sign-in failed. Please try again.";
                return;
            }
            window.location.reload();
        } catch {
            let message = document.getElementById("googleSignInStatus");
            if (!message) {
                message = document.createElement("p");
                message.id = "googleSignInStatus";
                message.className = "small text-danger mt-2";
                buttonHost.insertAdjacentElement("afterend", message);
            }
            message.textContent = "Unable to sign in right now. Please check your connection and try again.";
        } finally {
            buttonHost.removeAttribute("aria-busy");
        }
    };

    try {
        await loadGoogleScript();
        window.google.accounts.id.initialize({
            client_id: config.clientId,
            callback: handleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: "signin"
        });
        window.google.accounts.id.renderButton(buttonHost, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 220,
            logo_alignment: "left"
        });
        // Give visitors time to see the site before showing the optional One Tap prompt.
        window.setTimeout(() => {
            window.google.accounts.id.prompt();
        }, 3000);
    } catch (error) {
        console.warn("Google Identity Services could not be loaded.");
    }
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
        initializeGoogleSignIn();

        console.log("App loaded");
    }


);
