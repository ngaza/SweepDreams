import { createCleanerService } from "../services/cleanerService.js";

export function createCleanerController(bookings) {
  const service = createCleanerService(bookings);

  const listCleanerBookings = async (req, res) => {
    res.json(await service.listCleanerBookings(req.user));
  };

  const acceptBooking = async (req, res) => {
    res.json(await service.acceptBooking(req.params.id, req.user));
  };

  const saveProgress = async (req, res) => {
    res.json(await service.saveProgress(req.params.id, req.user, req.body));
  };

  const uploadProof = async (req, res) => {
    res.json(await service.uploadProof(req.params.id, req.user, req.body));
  };

  const completeBooking = async (req, res) => {
    res.json(await service.completeBooking(req.params.id, req.user));
  };

  return {
    listCleanerBookings,
    acceptBooking,
    saveProgress,
    uploadProof,
    completeBooking,
  };
}
