import { createBookingService } from "../services/bookingService.js";

export function createBookingController(bookings) {
  const service = createBookingService(bookings);

  const createBooking = async (req, res) => {
    res.status(201).json(await service.createBooking(req.body, req.user));
  };

  const listAccountBookings = async (req, res) => {
    res.json(await service.listAccountBookings(req.user));
  };

  const getBooking = async (req, res) => {
    res.json(await service.getBooking(req.booking));
  };

  const cancelBooking = async (req, res) => {
    res.json(await service.cancelBooking(req.params.id, req.user));
  };

  const submitFeedback = async (req, res) => {
    res.json(await service.submitFeedback(req.params.id, req.user, req.body));
  };

  return {
    createBooking,
    listAccountBookings,
    getBooking,
    cancelBooking,
    submitFeedback,
  };
}
