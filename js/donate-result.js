"use strict";

(() => {
    const API_BASE = "";

    const message = document.getElementById("result-message");
    const details = document.getElementById("result-details");
    const referenceField = document.getElementById("result-reference");
    const amountField = document.getElementById("result-amount");
    const statusField = document.getElementById("result-status");

    const reference = new URLSearchParams(
        window.location.search
    ).get("reference");

    const labels = {
        completed: "Payment confirmed",
        pending: "Awaiting payment confirmation",
        initiating: "Payment is being initialized",
        failed: "Payment failed",
        reversed: "Payment reversed",
        verification_error: "Payment requires further verification"
    };

    async function checkStatus() {
        if (!reference || !/^GOM-[0-9a-f-]{36}$/i.test(reference)) {
            message.textContent =
            "No valid donation reference was provided. Please contact the Foundation if you need help.";
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/api/donations/status/${encodeURIComponent(reference)}`,
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error("Status unavailable");
            }

            const donation = await response.json();

            referenceField.textContent = donation.reference;
            amountField.textContent = new Intl.NumberFormat(
                donation.currency === "UGX" ? "en-UG": "en-US",
                {
                    style: "currency",
                    currency: donation.currency,
                    maximumFractionDigits:
                    donation.currency === "UGX" ? 0: 2
                }
            ).format(donation.amount);

            statusField.textContent =
            labels[donation.status] || "Awaiting confirmation";

            details.hidden = false;

            if (donation.status === "completed") {
                message.textContent =
                "Pesapal has confirmed your donation. Thank you for your generosity.";
            } else if (donation.status === "failed") {
                message.textContent =
                "The payment was not completed. You may try again or contact the Foundation.";
            } else if (donation.status === "reversed") {
                message.textContent =
                "The payment was reversed. Please contact the Foundation for assistance.";
            } else {
                message.textContent =
                "Your payment has not yet been confirmed. Please wait a little and check again. Do not make another payment just because confirmation is delayed.";
            }
        } catch {
            message.textContent =
            "We could not retrieve your donation status right now. Your payment may still be processing. Please try again later or contact the Foundation.";
        }
    }

    checkStatus();

    // Payment confirmation can arrive after the browser returns from Pesapal.
    // Poll for up to two minutes without encouraging a duplicate payment.
    let attempts = 0;
    const poll = window.setInterval(async () => {
        attempts += 1;
        await checkStatus();
        const status = statusField.textContent;
        if (/Payment confirmed|Payment failed|Payment reversed/.test(status) || attempts >= 12) {
            window.clearInterval(poll);
        }
    }, 10000);
})();
