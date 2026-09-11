/**
 * Quiz formatting and schedule helper utilities
 */

/**
 * Formats quiz title cleanly:
 * - If no class is selected: ALWAYS strips "- कक्षा X" / "- Class X" so it says just "हिंदी दिवस प्रतियोगिता"
 * - If class IS selected (e.g. "कक्षा 5" or "Class 5"): displays "हिंदी दिवस प्रतियोगिता - कक्षा 5"
 */
export function formatQuizTitle(rawName: string = '', _selectedClassName?: string): string {
  // Always clean the title so no class name (e.g. - कक्षा 3, Class 3) appears on portal cards or modals
  let baseName = (rawName || 'हिंदी दिवस प्रतियोगिता')
    .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
    .replace(/क्विज़/g, 'प्रतियोगिता')
    .replace(/\s*[-–—:]\s*(कक्षा|class)\s*\d+/gi, '')
    .replace(/\s*\(\s*(कक्षा|class)\s*\d+\s*\)/gi, '')
    .replace(/(कक्षा|class)\s*\d+/gi, '')
    .trim();

  if (!baseName) {
    baseName = 'हिंदी दिवस प्रतियोगिता';
  }

  return baseName;
}

/**
 * Formats dates into "17 Aug, 2026" / "30 Sep, 2026" format
 */
export function formatDisplayDate(dateInput?: string | Date, fallback: string = '13 Sep, 2026'): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    const day = d.getDate();
    const strDay = day < 10 ? `0${day}` : `${day}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${strDay} ${month}, ${year}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats date into ordinal format like "13th Sep, 2026" (matches Reference Image)
 */
export function formatOrdinalDate(dateInput?: string | Date, fallback: string = '13th Sep, 2026'): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    const day = d.getDate();
    const j = day % 10, k = day % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    else if (j === 2 && k !== 12) suffix = 'nd';
    else if (j === 3 && k !== 13) suffix = 'rd';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}${suffix} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats time into "12:00 PM" format
 */
export function formatDisplayTime(dateInput?: string | Date, fallback: string = '12:00 PM'): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    const strHours = hours < 10 ? '0' + hours : hours;
    return `${strHours}:${strMinutes} ${ampm}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats quiz timing string into "00:10" and "Hours"
 */
export function formatQuizTimingParts(
  timing?: string,
  durationMinutes?: number,
  timePerQuestion?: number,
  numberOfQuestions?: number
): { timeVal: string; unitLabel: string } {
  if (timing && timing.includes('Hours')) {
    const parts = timing.split('Hours');
    return {
      timeVal: parts[0]?.trim() || '00:10',
      unitLabel: 'Hours',
    };
  }

  if (timing && timing.includes(':')) {
    const parts = timing.trim().split(/\s+/);
    return {
      timeVal: parts[0] || '00:10',
      unitLabel: parts[1] || 'Hours',
    };
  }

  const mins = durationMinutes || (timePerQuestion && numberOfQuestions ? Math.round((timePerQuestion * numberOfQuestions) / 60) : 10);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return {
    timeVal: `${String(hours).padStart(2, '0')}:${String(remMins).padStart(2, '0')}`,
    unitLabel: 'Hours',
  };
}
