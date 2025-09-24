class EvakaApiClient {
  private reservationData: EvakaTypes.ReservationData | null = null;
  private currentDateRange: EvakaTypes.DateRange | null = null;

  async fetchReservations(dateRange: EvakaTypes.DateRange | null = null): Promise<EvakaTypes.ReservationData | null> {
    try {
      const { from, to } = dateRange || DateUtils.getCurrentMonthRange();

      const response = await fetch(
        `/api/citizen/reservations?from=${from}&to=${to}`,
        {
          headers: { Accept: "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        this.reservationData = await response.json();
        console.log("Fetched new reservation data:", this.reservationData);
        this.currentDateRange = { from, to };
        return this.reservationData;
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
    return null;
  }

  getReservationData(): EvakaTypes.ReservationData | null {
    return this.reservationData;
  }

  getCurrentDateRange(): EvakaTypes.DateRange | null {
    return this.currentDateRange;
  }

  clearData(): void {
    this.reservationData = null;
    this.currentDateRange = null;
  }
}