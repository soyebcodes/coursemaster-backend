const Order = require('../models/Order');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Create SSLCommerz payment session for course purchase
 */
exports.createPaymentSession = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ student: userId, course: courseId });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check if there's a pending order
    const existingOrder = await Order.findOne({ 
      user: userId, 
      course: courseId, 
      status: 'pending' 
    });
    if (existingOrder) {
      return res.status(400).json({ message: 'Payment already in progress' });
    }

    // Create transaction ID
    const tran_id = 'COURSE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Create order record
    const order = await Order.create({
      user: userId,
      course: courseId,
      amount: course.price,
      paymentMethod: 'sslcommerz',
      transactionId: tran_id,
      status: 'pending'
    });

    // SSLCommerz payload
    const payload = {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      total_amount: course.price,
      currency: 'BDT',
      tran_id: tran_id,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      fail_url: `${process.env.FRONTEND_URL}/payment/fail`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      ipn_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      product_name: course.title,
      product_category: course.category || 'Education',
      product_profile: 'general',
      cus_name: req.user.name || 'Student',
      cus_email: req.user.email || 'student@example.com',
      cus_add1: 'Dhaka',
      cus_add2: 'Bangladesh',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01800000000',
      shipping_method: 'NO',
      multi_card_name: 'sslcommerz',
      value_a: userId,
      value_b: courseId,
      value_c: order._id.toString()
    };

    // Create SSLCommerz session
    const response = await axios.post(
      'https://sandbox.sslcommerz.com/gwprocess/v3/api.php',
      new URLSearchParams(payload).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.status === 'SUCCESS') {
      res.status(201).json({
        gatewayUrl: response.data.GatewayPageURL,
        orderId: order._id,
        tran_id
      });
    } else {
      await Order.findByIdAndDelete(order._id);
      res.status(500).json({ message: 'Failed to create payment session' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Validate SSLCommerz payment and create enrollment
 */
exports.validatePayment = async (req, res, next) => {
  try {
    const { tran_id } = req.query;

    if (!tran_id) {
      return res.status(400).json({ message: 'Transaction ID required' });
    }

    // Find order
    const order = await Order.findOne({ transactionId: tran_id }).populate('course');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order already processed' });
    }

    // Validate with SSLCommerz
    const validationPayload = {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      tran_id: tran_id,
      val_id: req.query.val_id,
      bank_tran_id: req.query.bank_tran_id,
      amount: req.query.amount,
      card_type: req.query.card_type
    };

    const validationResponse = await axios.post(
      'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
      new URLSearchParams(validationPayload).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (validationResponse.data.status === 'VALID' || validationResponse.data.element[0].error === '0') {
      // Update order status
      order.status = 'completed';
      order.completedAt = new Date();
      await order.save();

      // Create enrollment
      const { initializeProgress } = require('../utils/progressHelper');
      const enrollment = await Enrollment.create({
        student: order.user,
        course: order.course._id,
        progress: initializeProgress(order.course),
        percentageCompleted: 0
      });

      await enrollment.populate('course', 'title');
      await enrollment.populate('student', 'name email');

      res.status(201).json({
        message: 'Payment successful and enrollment created',
        order,
        enrollment
      });
    } else {
      order.status = 'failed';
      await order.save();
      res.status(400).json({ message: 'Payment validation failed' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * SSLCommerz IPN webhook handler
 */
exports.sslcommerzWebhook = async (req, res, next) => {
  try {
    const { tran_id, status, value_a, value_b, value_c } = req.body;

    // Verify the request is from SSLCommerz
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;

    if (status === 'VALID' || status === 'VALIDATED') {
      // Find and update order
      const order = await Order.findOne({ transactionId: tran_id });
      if (order && order.status === 'pending') {
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();

        // Create enrollment if not exists
        const existingEnrollment = await Enrollment.findOne({
          student: value_a,
          course: value_b
        });

        if (!existingEnrollment) {
          const course = await Course.findById(value_b);
          const { initializeProgress } = require('../utils/progressHelper');
          await Enrollment.create({
            student: value_a,
            course: value_b,
            progress: initializeProgress(course),
            percentageCompleted: 0
          });
        }
      }
    } else if (status === 'FAILED') {
      await Order.findOneAndUpdate(
        { transactionId: tran_id },
        { status: 'failed' }
      );
    }

    res.json({ status: 'received' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user's orders
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ user: userId });
    const orders = await Order.find({ user: userId })
      .populate('course', 'title description price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Webhook handler for Stripe events
 */
exports.stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update order status
      await Order.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { 
          status: 'completed',
          completedAt: new Date()
        }
      );
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await Order.findOneAndUpdate(
        { paymentIntentId: failedPayment.id },
        { status: 'failed' }
      );
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
