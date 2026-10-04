# Notton Commission

Commission, Admin, and Price rate for Notton. Firebase project: notton-commission.

Firebase Authentication uses Google sign-in. Firestore security rules allow public reading of website content and writing only by the verified owner account. Admin edits are shared between visitors; IndexedDB provides a browser cache, not the primary database.

Price rate reproduces the owner-provided Carrd reference and supports additional images, captions, and numbered pages. Images uploaded through its editor are resized to at most 1600 pixels before saving. Commercial use is 2.5×; no fixed 50-baht discount is applied.

Media uses immutable content-hash documents and chunks in Firestore, matching the original architecture. Firebase Spark quotas still apply; adding items has no application-defined count limit. Large production video libraries should use Cloud Storage with an approved billing plan.

Deploy the root folder as a static website. Add the production hostname in Firebase Authentication authorized domains before signing in there. Never add open-write database rules.
