"use strict";
var DateUtils;
(function (DateUtils) {
    function parseDateRange(titleText) {
        // Extract dates from "Läsnäolot 01.09. - 30.09.2025"
        const match = titleText.match(/(\d{2})\.(\d{2})\.\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/);
        if (match) {
            const [, fromDay, fromMonth, toDay, toMonth, year] = match;
            const from = `${year}-${fromMonth.padStart(2, "0")}-${fromDay.padStart(2, "0")}`;
            const to = `${year}-${toMonth.padStart(2, "0")}-${toDay.padStart(2, "0")}`;
            return { from, to };
        }
        return null;
    }
    DateUtils.parseDateRange = parseDateRange;
    function getCurrentMonthRange() {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0];
        return { from, to };
    }
    DateUtils.getCurrentMonthRange = getCurrentMonthRange;
    function getTodayDateString() {
        return new Date().toISOString().split("T")[0];
    }
    DateUtils.getTodayDateString = getTodayDateString;
})(DateUtils || (DateUtils = {}));
class EvakaApiClient {
    constructor() {
        this.reservationData = null;
        this.currentDateRange = null;
    }
    async fetchReservations(dateRange = null) {
        try {
            const { from, to } = dateRange || DateUtils.getCurrentMonthRange();
            const response = await fetch(`/api/citizen/reservations?from=${from}&to=${to}`, {
                headers: { Accept: "application/json" },
                credentials: "include",
            });
            if (response.ok) {
                this.reservationData = await response.json();
                console.log("Fetched new reservation data:", this.reservationData);
                this.currentDateRange = { from, to };
                return this.reservationData;
            }
        }
        catch (error) {
            console.error("Fetch error:", error);
        }
        return null;
    }
    getReservationData() {
        return this.reservationData;
    }
    getCurrentDateRange() {
        return this.currentDateRange;
    }
    clearData() {
        this.reservationData = null;
        this.currentDateRange = null;
    }
}
var ProjectionCalculator;
(function (ProjectionCalculator) {
    function calculateProjectedAttendance(child, days) {
        const today = DateUtils.getTodayDateString();
        const monthSummary = child.monthSummaries?.[0];
        if (!monthSummary)
            return null;
        // Get actual used minutes so far
        const usedServiceMinutes = monthSummary.usedServiceMinutes;
        // Get remaining reserved minutes for future days (excluding absences)
        let futureReservedMinutes = 0;
        days.forEach((day) => {
            if (day.date > today) {
                const dayChild = day.children.find((c) => c.childId === child.id);
                if (dayChild && !dayChild.absence) {
                    futureReservedMinutes += dayChild.usedService?.reservedMinutes || 0;
                }
            }
        });
        const projectedTotalMinutes = usedServiceMinutes + futureReservedMinutes;
        const serviceNeedMinutes = monthSummary.serviceNeedMinutes;
        return {
            usedHours: Math.floor(usedServiceMinutes / 60),
            usedMinutes: usedServiceMinutes % 60,
            futureHours: Math.floor(futureReservedMinutes / 60),
            futureMinutes: futureReservedMinutes % 60,
            projectedHours: Math.floor(projectedTotalMinutes / 60),
            projectedMinutes: projectedTotalMinutes % 60,
            allowedHours: Math.floor(serviceNeedMinutes / 60),
            allowedMinutes: serviceNeedMinutes % 60,
            overUnder: projectedTotalMinutes - serviceNeedMinutes,
        };
    }
    ProjectionCalculator.calculateProjectedAttendance = calculateProjectedAttendance;
})(ProjectionCalculator || (ProjectionCalculator = {}));
class UIEnhancer {
    enhanceMonthlyInfo(reservationData) {
        const infoElements = document.querySelectorAll('[data-qa="monthly-summary-info-text"]');
        infoElements.forEach((element, index) => {
            const child = reservationData.children[index];
            if (!child)
                return;
            const projection = ProjectionCalculator.calculateProjectedAttendance(child, reservationData.days);
            if (!projection)
                return;
            // Remove existing projection if it exists
            const existingProjection = element.querySelector('.evaka-assistant-projection');
            if (existingProjection) {
                existingProjection.remove();
            }
            // Calculate projection display values
            const overUnderHours = Math.floor(Math.abs(projection.overUnder) / 60);
            const overUnderMinutes = Math.abs(projection.overUnder) % 60;
            const overUnderText = projection.overUnder >= 0
                ? `+${overUnderHours} h ${overUnderMinutes} min`
                : `-${overUnderHours} h ${overUnderMinutes} min`;
            // Create projection element
            const projectionElement = document.createElement('div');
            projectionElement.className = 'evaka-assistant-projection';
            projectionElement.style.cssText = 'color: #666; font-size: 14px; margin-top: 5px;';
            projectionElement.textContent = `Ennuste ${projection.projectedHours} h ${projection.projectedMinutes} min / ${projection.allowedHours} h (${overUnderText})`;
            // Add to the info element
            element.appendChild(projectionElement);
        });
    }
    clearProjections() {
        const projectionElements = document.querySelectorAll('.evaka-assistant-projection');
        projectionElements.forEach((el) => el.remove());
    }
    getMonthlyTitleElement() {
        return document.querySelector('[data-qa="monthly-summary-info-title"]');
    }
}
const apiClient = new EvakaApiClient();
const uiEnhancer = new UIEnhancer();
function watchMonthlyTitle() {
    const observer = new MutationObserver(() => {
        const titleElement = uiEnhancer.getMonthlyTitleElement();
        if (titleElement) {
            const dateRange = DateUtils.parseDateRange(titleElement.textContent || "");
            const currentDateRange = apiClient.getCurrentDateRange();
            if (dateRange &&
                JSON.stringify(dateRange) !== JSON.stringify(currentDateRange)) {
                console.log("Month changed:", dateRange);
                // Clear projections and data when month changes
                uiEnhancer.clearProjections();
                apiClient.clearData();
                // Fetch new data for the new month
                apiClient.fetchReservations(dateRange).then((reservationData) => {
                    if (reservationData) {
                        uiEnhancer.enhanceMonthlyInfo(reservationData);
                    }
                });
            }
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
    // Check initial state
    const titleElement = uiEnhancer.getMonthlyTitleElement();
    if (titleElement) {
        const dateRange = DateUtils.parseDateRange(titleElement.textContent || "");
        if (dateRange) {
            apiClient.fetchReservations(dateRange).then((reservationData) => {
                if (reservationData) {
                    uiEnhancer.enhanceMonthlyInfo(reservationData);
                }
            });
        }
    }
}
// Start watching when page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchMonthlyTitle);
}
else {
    watchMonthlyTitle();
}
