const Order = require('../models/Order');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment intent for course purchase
 */
exports.createPaymentIntent = async (req, res, next) => {
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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create order record
    const order = await Order.create({
      user: userId,
      course: courseId,
      amount: course.price,
      paymentMethod: 'stripe',
      paymentIntentId: paymentIntent.id,
      status: 'pending'
    });

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Confirm payment and create enrollment
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Find order
    const order = await Order.findOne({ 
      paymentIntentId: paymentIntentId,
      user: userId
    }).populate('course');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order already processed' });
    }

    // Update order status
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    // Create enrollment
    const { initializeProgress } = require('../utils/progressHelper');
    const enrollment = await Enrollment.create({
      student: userId,
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
