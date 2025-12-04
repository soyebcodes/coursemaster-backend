const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

exports.list = async (req,res,next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    const search = req.query.search;
    const sort = req.query.sort; // 'price_asc', 'price_desc', 'rating', 'popular'
    const category = req.query.category;
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const instructor = req.query.instructor;

    const filter = {};
    if (category) filter.category = category;
    if (tags.length > 0) filter.tags = { $in: tags };
    if (instructor) filter.instructor = instructor;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let query = Course.find(filter).select('title description price category tags instructor createdAt');

    // Enhanced sorting options
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else if (sort === 'popular') {
      // Sort by enrollment count
      query = query.sort({ enrollmentCount: -1, createdAt: -1 });
    }
    else query = query.sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);
    const courses = await query.skip(skip).limit(limit).lean().exec();

    // Add enrollment count for each course if sorting by popularity
    if (sort === 'popular') {
      const courseIds = courses.map(c => c._id);
      const enrollmentCounts = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } }
      ]);
      
      const countMap = enrollmentCounts.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
      }, {});
      
      courses.forEach(course => {
        course.enrollmentCount = countMap[course._id.toString()] || 0;
      });
    }

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
