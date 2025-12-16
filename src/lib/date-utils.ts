import { addDays, addHours, isSaturday, isSunday, isWeekend, nextMonday } from 'date-fns';

/**
 * Checks if a date is a weekend and moves it to the next Monday if so.
 * Preserves the time of day.
 */
export function skipWeekend(date: Date | string): Date {
    const d = new Date(date);
    // If it's Saturday, add 2 days to get to Monday
    if (isSaturday(d)) {
        return addDays(d, 2);
    }
    // If it's Sunday, add 1 day to get to Monday
    if (isSunday(d)) {
        return addDays(d, 1);
    }
    return d;
}

/**
 * Calculates the end date by adding duration (in hours) to the start date,
 * skipping weekends.
 * Assumes duration is working hours.
 */
export function calculateEndDate(startDate: Date | string, durationHours: number): Date {
    let currentDate = new Date(startDate);
    // Ensure we start on a valid business day/time (optional, but good practice)
    currentDate = skipWeekend(currentDate);

    let remainingHours = Math.ceil(durationHours);

    // Safeguard for very large durations to prevent freezing
    // If duration > 1000 hours, we might want a math approach, but loop is fine for now
    // 1000 iterations is negligible in JS.
    if (remainingHours > 5000) {
        // Fallback: Just add raw hours if it's huge, to avoid loop checks
        return addHours(currentDate, remainingHours);
    }

    while (remainingHours > 0) {
        currentDate = addHours(currentDate, 1);

        // If we jumped into Saturday, skip to Monday
        if (isSaturday(currentDate)) {
            currentDate = addDays(currentDate, 2);
        } else if (isSunday(currentDate)) {
            // Should be covered by Saturday check usually, but for safety
            // (e.g. if we started on Sunday without skipping)
            currentDate = addDays(currentDate, 1);
        }

        remainingHours--;
    }

    return currentDate;
}
