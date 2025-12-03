const Course = require('../models/Course');

exports.list = async (req,res,next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    const search = req.query.search;
    const sort = req.query.sort; // 'price_asc' or 'price_desc'
    const category = req.query.category;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

    const filter = {};
    if (category) filter.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let query = Course.find(filter).select('title description price category tags instructor createdAt');

    // sorting
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);
    const courses = await query.skip(skip).limit(limit).lean().exec();

    res.json({
      data: courses,
      meta: { total, page, limit, totalPages: Math.ceil(total/limit) }
    });
  } catch(err){ next(err); }
};

exports.getById = async (req,res,next) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor','name email').lean();
    if(!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ course });
  } catch(err){ next(err); }
};
