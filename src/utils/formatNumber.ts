export function formatNumber(num: string): string {
  return num.toString().replace(/\d+/, function (n) {
    return n.replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
  });
}

export const formatNum = (num: string) => num.replace(/\d(?=(\d{3})+\b)/g, '$&,')