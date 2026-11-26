import { createConfigService } from "../../services/configService.js";

export function createConfigController(bookings) {
  const service = createConfigService(bookings);

  const getConfig = (req, res) => res.json(service.getConfig());

  const getAvailability = async (req, res) => {
    res.json(await service.getAvailability(req.query.date));
  };

  return { getConfig, getAvailability };
}
