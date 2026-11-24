export const publicBooking = (b) => {
  const { _id, token, userId, ...safe } = b;
  return safe;
};
