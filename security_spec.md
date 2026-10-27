# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny**: All paths not explicitly matched (`/databases/{database}/documents/{document=**}`) deny all reads and writes.
2. **Identity & Ownership Isolation (PII Protection)**:
   - `/users/{userId}` contains PII (`email`, `name`, `organization`). Only the document owner (`request.auth.uid == userId`) or a verified Admin (a user whose UID has a document in `/admins/{uid}` and whose email is verified) can `get`, `create`, or `update` the document.
   - `uid` in `/users/{userId}` must strictly equal `request.auth.uid` and `userId`, and is immutable on update.
3. **Privilege Escalation Prevention**:
   - Users creating `/users/{userId}` can only self-assign non-privileged roles (`STUDENT`, `EMPLOYER`, `INSTITUTION`). Only a verified Admin can assign `REGULATOR` or modify `role` on update.
4. **Temporal & Volumetric Integrity**:
   - All string fields enforce strict `.size()` bounds matching `firebase-blueprint.json`.
   - `createdAt` and `updatedAt` must equal `request.time` (server timestamp). `createdAt` is immutable on update.
5. **Query Enforcer on `/sessionLogs/{logId}`**:
   - `list` and `get` require `resource.data.ownerId == request.auth.uid || isAdmin()`.

## 2. The "Dirty Dozen" Payloads (Rejected with `PERMISSION_DENIED`)
1. **Unauthenticated Write**: `auth = null` writing to `/users/user_1`.
2. **Unverified Email Write**: `auth.token.email_verified = false` writing to `/users/user_1`.
3. **Identity Spoofing**: `auth.uid = "attacker"` creating `/users/victim` with `uid: "victim"`.
4. **Shadow Field Injection**: Creating `/users/user_1` with extra key `"isSuperAdmin": true`.
5. **Self-Assigned Regulator Role**: Non-admin creating `/users/user_1` with `role: "REGULATOR"`.
6. **Role Escalation on Update**: Non-admin updating `role` from `"STUDENT"` to `"REGULATOR"`.
7. **PII Cross-User Read**: `auth.uid = "user_2"` reading `/users/user_1`.
8. **Forged Client Timestamp**: Creating `/users/user_1` with `createdAt` set to a past timestamp instead of `request.time`.
9. **Immutable Field Mutation**: Updating `createdAt` or `uid` on `/users/user_1`.
10. **Oversized String ("Denial of Wallet")**: Creating `/sessionLogs/log_1` with `details` > 600 chars.
11. **ID Poisoning**: Creating `/sessionLogs/invalid id with spaces!` failing `isValidId()`.
12. **Blanket List Scraping**: Listing `/sessionLogs` without `where('ownerId', '==', request.auth.uid)`.
