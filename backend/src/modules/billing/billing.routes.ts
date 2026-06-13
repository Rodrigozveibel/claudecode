import { Router } from 'express';
import * as billingController from './billing.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', billingController.getInvoices);
router.get('/:id', billingController.getInvoice);
router.post('/', billingController.createInvoice);
router.put('/:id', billingController.updateInvoice);
router.post('/:id/issue', billingController.issueInvoice);
router.post('/:id/payment', billingController.recordPayment);

export default router;
