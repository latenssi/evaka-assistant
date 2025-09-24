namespace EvakaTypes {
  export interface DateRange {
    from: string;
    to: string;
  }

  export interface MonthSummary {
    year: number;
    month: number;
    serviceNeedMinutes: number;
    reservedMinutes: number;
    usedServiceMinutes: number;
  }

  export interface Child {
    id: string;
    firstName: string;
    lastName: string;
    monthSummaries: MonthSummary[];
  }

  export interface UsedService {
    reservedMinutes: number;
    usedServiceMinutes: number;
    usedServiceRanges: Array<{ start: string; end: string }>;
  }

  export interface Absence {
    type: string;
    editable: boolean;
  }

  export interface DayChild {
    childId: string;
    scheduleType: string;
    shiftCare: boolean;
    absence: Absence | null;
    reservations: any[];
    attendances: any[];
    usedService: UsedService;
    reservableTimeRange: any;
    holidayPeriodEffect: any;
  }

  export interface Day {
    date: string;
    holiday: boolean;
    children: DayChild[];
  }

  export interface ReservationData {
    children: Child[];
    days: Day[];
    reservableRange: { start: string; end: string };
  }

  export interface ProjectionData {
    usedHours: number;
    usedMinutes: number;
    futureHours: number;
    futureMinutes: number;
    projectedHours: number;
    projectedMinutes: number;
    allowedHours: number;
    allowedMinutes: number;
    overUnder: number;
  }
}