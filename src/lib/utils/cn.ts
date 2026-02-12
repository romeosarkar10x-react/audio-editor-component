import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...classValues: readonly ClassValue[]) {
    return twMerge(clsx(classValues));
}
