import { createAdminService } from "../services/adminService.js";

export function createAdminController(bookings) {
  const service = createAdminService(bookings);

  const listAdminBookings = async (req, res) => {
    res.json(await service.listAdminBookings());
  };

  const cancelAdminBooking = async (req, res) => {
    res.json(await service.cancelAdminBooking(req.params.id, req.body));
  };

  return {
    listAdminBookings,
    cancelAdminBooking,
  };
}
