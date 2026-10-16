"use strict";

(() => {
    const panel = document.getElementById("donation-enquiry");

    // Do nothing on pages without the donation enquiry fields.
    if (!panel) return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("donation") !== "enquiry") return;

    const amountField = document.getElementById("enquiry-amount");
    const frequencyField = document.getElementById("enquiry-frequency");
    const purposeField = document.getElementById("enquiry-purpose");

    if (!amountField || !frequencyField || !purposeField) return;

    const currency = params.get("currency");
    const frequency = params.get("frequency");
    const purpose = params.get("purpose");
    const rawAmount = params.get("amount");

    const allowedCurrencies = ["UGX",
        "USD"];
    const allowedFrequencies = ["once",
        "monthly"];

    const purposeLabels = {
        "where-needed": "Where the need is greatest",
        children: "Children and education",
        community: "Community support",
        emergency: "Emergency assistance"
    };

    const amount = Number(rawAmount);

    const validAmount =
    rawAmount !== null &&
    rawAmount.trim() !== "" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    (currency !== "UGX" || Number.isInteger(amount)) &&
    (currency !== "USD" || Number.isFinite(amount));

    const validSelection =
    allowedCurrencies.includes(currency) &&
    allowedFrequencies.includes(frequency) &&
    Object.prototype.hasOwnProperty.call(purposeLabels, purpose);

    if (!validAmount || !validSelection) {
        // Do not display incomplete or tampered donation details.
        return;
    }

    const formattedAmount = new Intl.NumberFormat(
        currency === "UGX" ? "en-UG": "en-US",
        {
            style: "currency",
            currency,
            maximumFractionDigits: currency === "UGX" ? 0: 2
        }
    ).format(amount);

    amountField.value = formattedAmount;
    frequencyField.value =
    frequency === "monthly" ? "Monthly preference": "One-time";
    purposeField.value = purposeLabels[purpose];

    panel.hidden = false;
})();
