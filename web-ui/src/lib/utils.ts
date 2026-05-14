import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind class 合并工具 (shadcn/ui 约定)。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
