export async function audit(db, action, entityType, entityId, userId, details, locationId = null) {
  await db.prepare(
    `INSERT INTO audit_log (action, entity_type, entity_id, location_id, user_id, timestamp, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(action, entityType, entityId, locationId, userId, Date.now(), details).run();
}
export const now = () => Date.now();
