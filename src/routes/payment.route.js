const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/payments/intent
 * Create payment intent for course purchase
 */
const createIntentSchema = Joi.object({
  courseId: Joi.string().required()
});

router.post('/intent', validate(createIntentSchema), paymentController.createPaymentIntent);

/**
 * POST /api/payments/confirm
 * Confirm payment and create enrollment
 */
const confirmSchema = Joi.object({
  paymentIntentId: Joi.string().required()
});

router.post('/confirm', validate(confirmSchema), paymentController.confirmPayment);

/**
 * GET /api/payments/orders
 * Get user's orders
 */
router.get('/orders', paymentController.getUserOrders);

/**
 * POST /api/payments/webhook
 * Stripe webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
