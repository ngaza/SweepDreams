export const pesos = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);
export const clock = (t) => {
  const [h, m] = t.split(":").map(Number);
  return (
    (h % 12 || 12) +
    ":" +
    String(m).padStart(2, "0") +
    " " +
    (h < 12 ? "AM" : "PM")
  );
};
