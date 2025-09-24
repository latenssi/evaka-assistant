let reservationData = null;
let currentDateRange = null;

// Parse date range from the monthly summary title
function parseDateRange(titleText) {
  // Extract dates from "Läsnäolot 01.09. - 30.09.2025"
  const match = titleText.match(
    /(\d{2})\.(\d{2})\.\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/
  );
  if (match) {
    const [, fromDay, fromMonth, toDay, toMonth, year] = match;
    const from = `${year}-${fromMonth.padStart(2, "0")}-${fromDay.padStart(
      2,
      "0"
    )}`;
    const to = `${year}-${toMonth.padStart(2, "0")}-${toDay.padStart(2, "0")}`;
    return { from, to };
  }
  return null;
}

// Fetch reservations with specific date range
async function fetchReservations(dateRange = null) {
  try {
    let from, to;

    if (dateRange) {
      from = dateRange.from;
      to = dateRange.to;
    } else {
      // Fallback to current month
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
    }

    const response = await fetch(
      `/api/citizen/reservations?from=${from}&to=${to}`,
      {
        headers: { Accept: "application/json" },
        credentials: "include",
      }
    );

    if (response.ok) {
      reservationData = await response.json();
      currentDateRange = { from, to };
      return reservationData;
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
  return null;
}

// Calculate projected attendance for a child
function calculateProjectedAttendance(child, days) {
  const today = new Date().toISOString().split("T")[0];
  const monthSummary = child.monthSummaries?.[0];

  if (!monthSummary) return null;

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

// Enhance monthly summary with projected data
function enhanceMonthlyInfo() {
  if (!reservationData) return;

  const infoElements = document.querySelectorAll(
    '[data-qa="monthly-summary-info-text"]'
  );

  infoElements.forEach((element, index) => {
    const child = reservationData.children[index];
    if (!child) return;

    const projection = calculateProjectedAttendance(
      child,
      reservationData.days
    );
    if (!projection) return;

    // Find existing content
    const paragraphs = element.querySelectorAll("p");
    if (paragraphs.length < 2) return;

    const currentText = paragraphs[1].innerHTML;

    // Add projected information
    const overUnderHours = Math.floor(Math.abs(projection.overUnder) / 60);
    const overUnderMinutes = Math.abs(projection.overUnder) % 60;
    const overUnderText =
      projection.overUnder >= 0
        ? `+${overUnderHours} h ${overUnderMinutes} min`
        : `-${overUnderHours} h ${overUnderMinutes} min`;

    const projectedLine = `<br><span style="color: #666;">Ennuste ${projection.projectedHours} h ${projection.projectedMinutes} min / ${projection.allowedHours} h (${overUnderText})</span>`;

    if (!currentText.includes("Ennuste")) {
      paragraphs[1].innerHTML = currentText + projectedLine;
    }
  });
}

// Watch for changes in the monthly summary title
function watchMonthlyTitle() {
  const observer = new MutationObserver(() => {
    const titleElement = document.querySelector(
      '[data-qa="monthly-summary-info-title"]'
    );
    if (titleElement) {
      const dateRange = parseDateRange(titleElement.textContent);
      if (
        dateRange &&
        JSON.stringify(dateRange) !== JSON.stringify(currentDateRange)
      ) {
        console.log("Month changed:", dateRange);
        currentDateRange = dateRange;

        // Clear enhanced info when month changes
        const infoElements = document.querySelectorAll(
          '[data-qa="monthly-summary-info-text"] p:last-child'
        );
        infoElements.forEach((el) => {
          if (el.innerHTML.includes("Ennuste")) {
            el.innerHTML = el.innerHTML.split(
              '<br><span style="color: #666;">Ennuste'
            )[0];
          }
        });

        reservationData = null; // Clear previous data

        // Fetch new data for the new month
        fetchReservations(currentDateRange).then((data) => {
          reservationData = data;
          console.log("Fetched new reservation data:", reservationData);
          if (data) {
            enhanceMonthlyInfo();
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
  const titleElement = document.querySelector(
    '[data-qa="monthly-summary-info-title"]'
  );
  if (titleElement) {
    const dateRange = parseDateRange(titleElement.textContent);
    if (dateRange) {
      currentDateRange = dateRange;
    }
  }
}

// Start watching when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", watchMonthlyTitle);
} else {
  watchMonthlyTitle();
}

