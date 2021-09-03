import { today, next } from "./date-time";
export const RANGE_TIMES = ["10:30", "21:30"];
/**
 * 
 * @returns hour (in 24-hour format) of restaurant's opening time
 */
export function earliestHour() {
    const EARLIEST_SPLIT = RANGE_TIMES[0].split(":").map(x => parseInt(x));
    return EARLIEST_SPLIT[0];
}

/**
 * 
 * @returns hour (in 24-hour format) of restaurant's closing time
 */
export function latestHour() {
    const LATEST_SPLIT = RANGE_TIMES[1].split(":").map(x => parseInt(x));
    return LATEST_SPLIT[0];
}

/**
 * 
 * @param {Date} someDate 
 * @returns restaurant's opening time on the specified date
 */
export function getOpenOn(someDate) {
    const year = someDate.getFullYear();
    const month = someDate.getMonth();
    const day = someDate.getDate();
    const EARLIEST_SPLIT = RANGE_TIMES[0].split(":").map(x => parseInt(x));
    const EARLIEST_TIME = new Date(year, month, day,
        EARLIEST_SPLIT[0], EARLIEST_SPLIT[1]);
    return EARLIEST_TIME;
}

/**
 * 
 * @param {Date} someDate 
 * @returns restaurant's closing time (earlier than midnight) on the specified date
 */
export function getCloseOn(someDate) {
    const year = someDate.getFullYear();
    const month = someDate.getMonth();
    const day = someDate.getDate();
    const LATEST_SPLIT = RANGE_TIMES[1].split(":").map(x => parseInt(x));
    const LATEST_TIME = new Date(year, month, day,
        LATEST_SPLIT[0], LATEST_SPLIT[1]);
    return LATEST_TIME;
}

/**
 * 
 * @returns default time to initially populate the form; either 
 * 1) the opening time of the next day if A) the current date is a Tuesday 
 * or B) the current time is after the closing time
 * 2) the top of the next full hour in the restaurant's operating window
 * 3) the closing time (not a top of the hour, e.g. 23:00) if in the last
 * truncated hour of the restaurant's operating window
 */
export function getFirstTopHour() {
    const CURRENT_TIME = new Date();
    if(CURRENT_TIME.getDay() === 2 || CURRENT_TIME > getCloseOn(CURRENT_TIME)) {
        const tomorrowStr = next(today());
        const fields = tomorrowStr.split("-");
        const tomorrowMidnight = new Date(parseInt(fields[0]),
        parseInt(fields[1])-1, parseInt(fields[2]));
        return getOpenOn(tomorrowMidnight);
    }
    else {
        const openToday = getOpenOn(CURRENT_TIME);
        if(CURRENT_TIME < openToday) return openToday;
        const CURRENT_HOUR = CURRENT_TIME.getHours();
        if(CURRENT_HOUR < latestHour()) {
        const topNextHour = new Date(CURRENT_TIME.getFullYear(),
            CURRENT_TIME.getMonth(),
            CURRENT_TIME.getDate(),
            CURRENT_HOUR + 1,
            0);
        return topNextHour;
        }
        return getCloseOn(CURRENT_TIME);
    }
}

/**
 * 
 * @param {Number} x 
 * @returns "0X" if "X" is a single digit
 */
 function padInt(x) {
    return x.toString().padStart(2, "0");
  }

export function defaultDateTimeFormatted() {
    const DEFAULT_FORM_TIME = getFirstTopHour();
    return {
        date: [DEFAULT_FORM_TIME.getFullYear(),
        padInt(DEFAULT_FORM_TIME.getMonth()+1),
        padInt(DEFAULT_FORM_TIME.getDate())].join("-"),
        time: [padInt(DEFAULT_FORM_TIME.getHours()),
            padInt(DEFAULT_FORM_TIME.getMinutes())].join(":")
    };
}