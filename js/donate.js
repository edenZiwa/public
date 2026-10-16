"use strict";

(() => {
    const form = document.getElementById("donation-form");
    const API_BASE = "";

    if (!form) return;

    const amountInput = document.getElementById("custom-amount");
    const amountButtons = [
        ...form.querySelectorAll(".amount-option")
    ];

    const currencyInputs = [
        ...form.querySelectorAll('input[name="currency"]')
    ];

    const frequencyInputs = [
        ...form.querySelectorAll('input[name="frequency"]')
    ];

    const purposeSelect = document.getElementById("donation-purpose");
    const pageParams = new URLSearchParams(window.location.search);
    const childProfileId = pageParams.get("child");
    if (pageParams.get("purpose") === "children") purposeSelect.value = "children";
    if (childProfileId) {
        purposeSelect.value = "children";
        const notice = document.getElementById("sponsorship-context");
        if (notice) {
            notice.hidden = false;
            notice.textContent = "Your gift will be recorded for the selected child sponsorship profile, subject to current availability.";
        }
    }
    const summaryAmount = document.getElementById("summary-amount");
    const summaryFrequency = document.getElementById("summary-frequency");
    const summaryPurpose = document.getElementById("summary-purpose");
    const amountHelp = document.getElementById("amount-help");
    const errorMessage = document.getElementById("donation-error");

    const presets = {
        UGX: [10000,
            25000,
            50000,
            100000],
        USD: [10,
            25,
            50,
            100]
    };

    const currency = () =>
    form.querySelector('input[name="currency"]:checked')?.value || "UGX";

    const frequency = () =>
    form.querySelector('input[name="frequency"]:checked')?.value || "one-time";

    const selectedAmount = () => {
        const value = amountInput.value.trim();

        if (!value) return 0;

        const amount = Number(value);

        return Number.isFinite(amount) && amount > 0
        ? amount: 0;
    };

    const formatter = (value) =>
    new Intl.NumberFormat(
        currency() === "UGX" ? "en-UG": "en-US",
        {
            style: "currency",
            currency: currency(),
            maximumFractionDigits: currency() === "UGX" ? 0: 2
        }
    ).format(value);

    function clearPresetSelection() {
        amountButtons.forEach((button) => {
            button.setAttribute("aria-pressed", "false");
        });
    }

    function updatePresets() {
        const selectedCurrency = currency();

        amountButtons.forEach((button, index) => {
            const amount = presets[selectedCurrency][index];

            button.dataset.amount = String(amount);
            button.textContent = new Intl.NumberFormat(
                selectedCurrency === "UGX" ? "en-UG": "en-US"
            ).format(amount);
        });

        amountInput.value = "";
        amountInput.min = "1";
        amountInput.step = selectedCurrency === "UGX" ? "1": "0.01";
        amountInput.placeholder = selectedCurrency === "UGX"
        ? "e.g. 25000": "e.g. 25";

        amountHelp.textContent = selectedCurrency === "UGX"
        ? "Enter an amount in Uganda shillings.": "Enter an amount in US dollars.";

        clearPresetSelection();
        updateSummary();
    }

    function updateSummary() {
        const amount = selectedAmount();

        summaryAmount.textContent = formatter(amount);
        summaryFrequency.textContent = frequency() === "monthly"
        ? "Monthly giving preference": "One-time donation";

        summaryPurpose.textContent =
        purposeSelect.options[purposeSelect.selectedIndex].text;

        errorMessage.hidden = true;
        errorMessage.textContent = "";
    }
    
    function selectedPesapalHosts() {
        return ["cybqa.pesapal.com", "pay.pesapal.com"];
    }

    amountButtons.forEach((button) => {
        button.addEventListener("click", () => {
            amountInput.value = button.dataset.amount;
            amountInput.setCustomValidity("");
            amountInput.classList.remove("is-invalid");

            clearPresetSelection();
            button.setAttribute("aria-pressed", "true");

            updateSummary();
        });
    });

    amountInput.addEventListener("input", () => {
        clearPresetSelection();
        amountInput.setCustomValidity("");
        amountInput.classList.remove("is-invalid");
        updateSummary();
    });

    currencyInputs.forEach((input) => {
        input.addEventListener("change", updatePresets);
    });

    frequencyInputs.forEach((input) => {
        input.addEventListener("change", updateSummary);
    });

    purposeSelect.addEventListener("change", updateSummary);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        errorMessage.hidden = true;
        amountInput.setCustomValidity("");

        const amount = selectedAmount();
        const selectedCurrency = currency();

        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            (selectedCurrency === "UGX" && !Number.isInteger(amount)) ||
            (selectedCurrency === "USD" &&
                Math.round(amount * 100) !== amount * 100)
        ) {
            amountInput.setCustomValidity("Enter a valid donation amount.");
            amountInput.classList.add("is-invalid");
            amountInput.reportValidity();
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const firstName =
        document.getElementById("donor-first-name").value.trim();
        const lastName =
        document.getElementById("donor-last-name").value.trim();
        const email =
        document.getElementById("donor-email").value.trim();
        const phone =
        document.getElementById("donor-phone").value.trim();

        if (!firstName || (!email && !phone)) {
            errorMessage.textContent =
            "Enter your first name and either an email address or phone number.";
            errorMessage.hidden = false;
            return;
        }

        // Recurring payments are not yet implemented.
        if (frequency() === "monthly") {
            errorMessage.textContent =
            "Monthly payments are not enabled yet. Please select one-time giving.";
            errorMessage.hidden = false;
            return;
        }

        const submitButton =
        document.getElementById("donation-submit");

        const originalLabel = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.textContent = "Connecting securely…";

        try {
            const response = await fetch(
                `${API_BASE}/api/donations/checkout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    cache: "no-store",
                    credentials: "same-origin",
                    body: JSON.stringify({
                        amount,
                        currency: selectedCurrency,
                        purpose: purposeSelect.value,
                        frequency: frequency() === "once" ? "one-time" : frequency(),
                        name: [firstName, lastName].filter(Boolean).join(" "),
                        email,
                        phone,
                        ...(childProfileId ? { childProfileId } : {})
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to start payment."
                );
            }

            // Validate the checkout destination before redirecting.
            const checkout = new URL(data.checkoutUrl);

            const trustedHosts = selectedPesapalHosts();

            if (
                checkout.protocol !== "https:" ||
                !trustedHosts.includes(checkout.hostname)
            ) {
                throw new Error("The payment provider returned an invalid URL.");
            }

            window.location.assign(checkout.href);
        } catch (error) {
            errorMessage.textContent =
            error instanceof TypeError
            ? "Could not reach the payment service. Please try again later.": error.message || "Payment setup failed. Please try again.";

            errorMessage.hidden = false;
            submitButton.disabled = false;
            submitButton.innerHTML = originalLabel;
        }
    });

    updatePresets();
})();
