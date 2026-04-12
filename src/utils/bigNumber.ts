export const formatBigNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const absolute = Math.abs(value);

  if (absolute < 1000) {
    return value >= 10 ? Math.floor(value).toString() : value.toFixed(1).replace(/\.0$/, "");
  }

  const units = ["K", "M", "B", "T", "Qa", "Qi"];
  let scaled = absolute;
  let unitIndex = -1;

  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  const formatted = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
  const prefix = value < 0 ? "-" : "";

  return `${prefix}${formatted.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}${units[unitIndex]}`;
};