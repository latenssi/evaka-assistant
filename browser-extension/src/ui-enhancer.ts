class UIEnhancer {
  enhanceMonthlyInfo(reservationData: EvakaTypes.ReservationData): void {
    const infoElements = document.querySelectorAll(
      '[data-qa="monthly-summary-info-text"]'
    );

    infoElements.forEach((element, index) => {
      const child = reservationData.children[index];
      if (!child) return;

      const projection = ProjectionCalculator.calculateProjectedAttendance(child, reservationData.days);
      if (!projection) return;

      // Remove existing projection if it exists
      const existingProjection = element.querySelector('.evaka-assistant-projection');
      if (existingProjection) {
        existingProjection.remove();
      }

      // Calculate projection display values
      const overUnderHours = Math.floor(Math.abs(projection.overUnder) / 60);
      const overUnderMinutes = Math.abs(projection.overUnder) % 60;
      const overUnderText =
        projection.overUnder >= 0
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

  clearProjections(): void {
    const projectionElements = document.querySelectorAll('.evaka-assistant-projection');
    projectionElements.forEach((el) => el.remove());
  }

  getMonthlyTitleElement(): Element | null {
    return document.querySelector('[data-qa="monthly-summary-info-title"]');
  }
}