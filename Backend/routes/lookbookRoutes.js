import express from 'express';
import {
  createLookbookEntry,
  deleteLookbookEntry,
  listAdminLookbookEntries,
  listLookbookEntries,
  updateLookbookEntry,
} from '../controllers/lookbookController.js';
import { protect, admin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createLookbookEntrySchema,
  lookbookParamsSchema,
  updateLookbookEntrySchema,
} from '../validators/lookbook.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.get('/', listLookbookEntries);

adminRouter.use(protect, admin);
adminRouter.get('/', listAdminLookbookEntries);
adminRouter.post('/', validateRequest({ body: createLookbookEntrySchema }), createLookbookEntry);
adminRouter.put(
  '/:id',
  validateRequest({ params: lookbookParamsSchema, body: updateLookbookEntrySchema }),
  updateLookbookEntry
);
adminRouter.delete('/:id', validateRequest({ params: lookbookParamsSchema }), deleteLookbookEntry);

export { adminRouter as adminLookbookRoutes, publicRouter as lookbookRoutes };

