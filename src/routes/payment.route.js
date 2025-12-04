const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/payments/create-session
 * Create SSLCommerz payment session for course purchase
 */
const createSessionSchema = Joi.object({
  courseId: Joi.string().required()
});

router.post('/create-session', validate(createSessionSchema), paymentController.createPaymentSession);

/**
 * GET /api/payments/validate
 * Validate SSLCommerz payment and create enrollment
 */
router.get('/validate', paymentController.validatePayment);

/**
 * POST /api/payments/webhook
 * SSLCommerz IPN webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.sslcommerzWebhook);

/**
 * GET /api/payments/orders
 * Get user's orders
 */
router.get('/orders', paymentController.getUserOrders);

module.exports = router;
