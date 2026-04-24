import { Router } from 'express';
import * as billingController from './billing.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/invoices', billingController.getInvoices);
router.post('/invoices', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT'), billingController.createInvoice);
router.get('/invoices/report', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'), billingController.getBillingReport);
router.get('/invoices/:id', billingController.getInvoiceById);
router.put('/invoices/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'), billingController.updateInvoice);
router.post('/invoices/:id/issue', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'), billingController.issueInvoice);
router.post('/invoices/:id/discount', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), billingController.applyDiscount);

router.post('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT'), billingController.recordPayment);
router.post('/payments/:paymentId/refund', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), billingController.refundPayment);

export default router;
