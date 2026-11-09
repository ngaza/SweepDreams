export async function createUserModel(db) {
  const users = db.collection("users"),
    sessions = db.collection("sessions");
  await users.createIndex({ email: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await sessions.createIndex({ tokenHash: 1 }, { unique: true });
  return { users, sessions };
}