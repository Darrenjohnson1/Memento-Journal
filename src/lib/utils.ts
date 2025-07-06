import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    return { errorMessage: error.message };
  } else {
    return { errorMessage: "An error occurred" };
  }
};

// Returns the Date object for the Monday of the given ISO week and year (ISO 8601)
export function getDateOfISOWeek(week: number, year: number): Date {
  // The 4th of January is always in week 1
  const simple = new Date(year, 0, 4);
  const dayOfWeek = simple.getDay() || 7; // Make Sunday (0) be 7
  const mondayOfWeek1 = new Date(simple);
  mondayOfWeek1.setDate(simple.getDate() - dayOfWeek + 1);
  const result = new Date(mondayOfWeek1);
  result.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  result.setHours(0, 0, 0, 0);
  return result;
}
