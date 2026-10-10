export const getPageWindow = (page: number, totalPages: number): number[] => {
  const current = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const start = Math.max(1, Math.min(current - 2, totalPages - 4));
  return Array.from({ length: Math.max(0, Math.min(5, totalPages)) }, (_, index) => start + index);
};
