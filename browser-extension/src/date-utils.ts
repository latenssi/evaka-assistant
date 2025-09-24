namespace DateUtils {
  export function parseDateRange(titleText: string): EvakaTypes.DateRange | null {
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

  export function getCurrentMonthRange(): EvakaTypes.DateRange {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    return { from, to };
  }

  export function getTodayDateString(): string {
    return new Date().toISOString().split("T")[0];
  }
}