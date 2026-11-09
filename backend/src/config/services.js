export const checklist = [
  "Sweep and mop accessible floors",
  "Wipe desks and accessible surfaces",
  "Empty room trash",
  "Tidy common room areas",
];
export const prices = { small: 300, standard: 450 };
export const addons = {
  laundry: { name: "Laundry fold", price: 80 },
  dishes: { name: "Dishes", price: 50 },
  fridge: { name: "Fridge clean", price: 200 },
};
export const payments = [
  {
    id: "cash",
    name: "Cash on service",
    note: "Pay after your cleaning visit",
  },
  {
    id: "gcash",
    name: "GCash",
    note: "Our team sends payment details after confirming",
  },
];
export const paymentIds = payments.map((p) => p.id);
export const services = [
  {
    id: "basic",
    name: "Basic dorm cleaning",
    category: "Dorm",
    desc: "About 1 hour · One-time clean",
    hours: "about 1 hour",
    sized: true,
    included: null,
  },
  {
    id: "dorm_deep",
    name: "Dorm deep clean",
    category: "Dorm",
    desc: "1-2 hrs · Single room",
    hours: "1-2 hours",
    price: 499,
    included: [
      "Dusting, sweeping, mopping",
      "Bed making and linen change",
      "Trash removal and disinfecting",
    ],
  },
  {
    id: "home_regular",
    name: "Regular home cleaning",
    category: "Home",
    desc: "2-3 hrs · Homes and apartments",
    hours: "2-3 hours",
    price: 699,
    included: [
      "Dusting, sweeping, mopping",
      "Kitchen and bathroom wipe-down",
      "Trash removal",
    ],
  },
  {
    id: "move",
    name: "Move-in / move-out",
    category: "Home",
    desc: "3-4 hrs · Deep sanitation",
    hours: "3-4 hours",
    price: 1299,
    included: [
      "Deep sanitation of all rooms",
      "Kitchen and bathroom scrub",
      "Floor mopping and trash removal",
    ],
  },
];
export const slots = ["09:00", "11:00", "13:00", "15:00"];