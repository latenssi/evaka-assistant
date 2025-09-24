namespace ProjectionCalculator {
  export function calculateProjectedAttendance(
    child: EvakaTypes.Child,
    days: EvakaTypes.Day[]
  ): EvakaTypes.ProjectionData | null {
    const today = DateUtils.getTodayDateString();
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
}