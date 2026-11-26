export const ROUTES = [
  "start",
  "home",
  "detail",
  "book",
  "track",
  "admin",
  "admin-login",
  "login",
  "signup",
  "cleaner",
];

export const PROTECTED_ROUTES = ["book", "track", "cleaner"];

export const INITIAL_BOOKING_FORM = {
  serviceId: "basic",
  addons: [],
  paymentMethod: "cash",
  size: "small",
  date: "",
  time: "09:00",
  name: "",
  contact: "",
  room: "",
  notes: "",
};

export const ADMIN_POLL_INTERVAL_MS = 2000;
