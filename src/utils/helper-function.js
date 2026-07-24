export const formatDate = (dateValue) => {
  if (!dateValue) return '-';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
  // this function will return "2026-07-22T07:00:01.058036Z" data & time format to "DD-MM-YYYY"
};