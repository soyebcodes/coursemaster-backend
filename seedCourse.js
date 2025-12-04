// seedCourses.js
const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./src/models/Course');
const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

const instructors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: '$2b$10$examplehash', // Hashed 'password123'
    role: 'instructor',
    bio: 'Senior Web Developer with 10+ years of experience in full-stack development',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    name: 'Prof. Michael Chen',
    email: 'michael.chen@example.com',
    password: '$2b$10$examplehash',
    role: 'instructor',
    bio: 'Data Science expert and Machine Learning Engineer',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Alex Thompson',
    email: 'alex.thompson@example.com',
    password: '$2b$10$examplehash',
    role: 'instructor',
    bio: 'Mobile App Developer and UI/UX Enthusiast',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    name: 'Dr. Emily Wilson',
    email: 'emily.wilson@example.com',
    password: '$2b$10$examplehash',
    role: 'instructor',
    bio: 'Cybersecurity Specialist and Ethical Hacker',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg'
  }
];

const courses = [
  {
    title: 'Complete Web Development Bootcamp 2024',
    slug: 'complete-web-development-bootcamp-2024',
    description: 'Become a full-stack web developer with just one course. HTML, CSS, JavaScript, Node, React, MongoDB and more!',
    price: 199,
    discountPrice: 149,
    category: 'Web Development',
    level: 'Beginner',
    duration: 60,
    totalStudents: 1250,
    rating: 4.7,
    tags: ['web', 'javascript', 'react', 'node', 'mongodb'],
    thumbnail: 'https://img-c.udemycdn.com/course/480x270/1565838_e54e_16.jpg',
    instructor: null,
    lessons: [
      { title: 'Introduction to Web Development', duration: 45, type: 'video', url: 'https://example.com/video1' },
      { title: 'HTML5 Fundamentals', duration: 90, type: 'video', url: 'https://example.com/video2' },
      { title: 'CSS3 and Responsive Design', duration: 120, type: 'video', url: 'https://example.com/video3' }
    ],
    batches: [
      { name: 'Weekend Batch', schedule: 'Sat-Sun 10AM-12PM', startDate: new Date('2026-02-01'), seats: 30 },
      { name: 'Weekday Batch', schedule: 'Mon-Wed-Fri 7PM-8PM', startDate: new Date('2026-02-05'), seats: 25 }
    ]
  },
  {
    title: 'Machine Learning A-Z: Hands-On Python & R In Data Science',
    slug: 'machine-learning-az-hands-on-python-r',
    description: 'Learn to create Machine Learning Algorithms in Python and R from two Data Science experts. Code templates included.',
    price: 299,
    discountPrice: 199,
    category: 'Data Science',
    level: 'Intermediate',
    duration: 45,
    totalStudents: 980,
    rating: 4.6,
    tags: ['machine learning', 'python', 'data science', 'ai'],
    thumbnail: 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg',
    instructor: null,
    lessons: [
      { title: 'Introduction to Machine Learning', duration: 60, type: 'video', url: 'https://example.com/ml1' },
      { title: 'Data Preprocessing', duration: 90, type: 'video', url: 'https://example.com/ml2' },
      { title: 'Regression Models', duration: 120, type: 'video', url: 'https://example.com/ml3' }
    ],
    batches: [
      { name: 'Morning Batch', schedule: 'Mon-Fri 9AM-11AM', startDate: new Date('2026-03-10'), seats: 20 },
      { name: 'Evening Batch', schedule: 'Mon-Wed-Fri 6PM-8PM', startDate: new Date('2026-03-15'), seats: 25 }
    ]
  },
  {
    title: 'The Complete JavaScript Course 2024: From Zero to Expert!',
    slug: 'complete-javascript-course-2024',
    description: 'The modern JavaScript course for everyone! Master JavaScript with projects, challenges and theory. Many courses in one!',
    price: 179,
    discountPrice: 129,
    category: 'Web Development',
    level: 'Beginner',
    duration: 68,
    totalStudents: 2150,
    rating: 4.8,
    tags: ['javascript', 'es6', 'async', 'dom'],
    thumbnail: 'https://img-c.udemycdn.com/course/480x270/851712_fc61_6.jpg',
    instructor: null,
    lessons: [
      { title: 'JavaScript Fundamentals', duration: 90, type: 'video', url: 'https://example.com/js1' },
      { title: 'DOM Manipulation', duration: 120, type: 'video', url: 'https://example.com/js2' },
      { title: 'Modern ES6+', duration: 150, type: 'video', url: 'https://example.com/js3' }
    ],
    batches: [
      { name: 'Evening Batch', schedule: 'Mon-Wed-Fri 8PM-10PM', startDate: new Date('2026-02-15'), seats: 25 },
      { name: 'Weekend Intensive', schedule: 'Sat-Sun 1PM-5PM', startDate: new Date('2026-02-20'), seats: 20 }
    ]
  },
  {
    title: 'iOS & Swift - The Complete iOS App Development Bootcamp',
    slug: 'ios-swift-complete-ios-app-development',
    description: 'From Beginner to iOS App Developer with Just One Course! Fully Updated with a Comprehensive Module Dedicated to SwiftUI!',
    price: 249,
    discountPrice: 199,
    category: 'Mobile Development',
    level: 'Beginner',
    duration: 55,
    totalStudents: 10,
    rating: 4.8,
    tags: ['ios', 'swift', 'mobile', 'app development'],
    thumbnail: 'https://img-c.udemycdn.com/course/480x270/1778502_f4b9_12.jpg',
    instructor: null,
    lessons: [
      { title: 'Introduction to Swift', duration: 90, type: 'video', url: 'https://example.com/ios1' },
      { title: 'Xcode Basics', duration: 60, type: 'video', url: 'https://example.com/ios2' },
      { title: 'Building Your First App', duration: 120, type: 'video', url: 'https://example.com/ios3' }
    ],
    batches: [
      { name: 'Weekday Batch', schedule: 'Tue-Thu 7PM-9PM', startDate: new Date('2026-04-05'), seats: 20 },
      { name: 'Weekend Batch', schedule: 'Sat-Sun 10AM-2PM', startDate: new Date('2026-04-10'), seats: 15 }
    ]
  },
  {
    title: 'The Complete Cyber Security Course: Hackers Exposed!',
    slug: 'complete-cyber-security-course',
    description: 'Volume 1: Become a Cyber Security Specialist, Learn How to Stop Hackers, Prevent Hacking, Learn IT Security & INFOSEC',
    price: 199,
    discountPrice: 149,
    category: 'Cyber Security',
    level: 'Intermediate',
    duration: 40,
    totalStudents: 3200,
    rating: 4.7,
    tags: ['cyber security', 'hacking', 'ethical hacking', 'infosec'],
    thumbnail: 'https://img-c.udemycdn.com/course/480x270/614772_233b_9.jpg',
    instructor: null,
    lessons: [
      { title: 'Introduction to Cyber Security', duration: 60, type: 'video', url: 'https://example.com/sec1' },
      { title: 'Networking Basics', duration: 90, type: 'video', url: 'https://example.com/sec2' },
      { title: 'Encryption & Anonymity', duration: 120, type: 'video', url: 'https://example.com/sec3' }
    ],
    batches: [
      { name: 'Evening Batch', schedule: 'Mon-Wed 8PM-10PM', startDate: new Date('2026-05-01'), seats: 25 },
      { name: 'Weekend Intensive', schedule: 'Sat 9AM-5PM', startDate: new Date('2026-05-07'), seats: 20 }
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});

    console.log('Cleared existing data');

    // Create instructors
    const createdInstructors = await User.insertMany(instructors);
    console.log(`Created ${createdInstructors.length} instructors`);

    // Assign instructors to courses in a round-robin fashion
    const coursesWithInstructors = courses.map((course, index) => ({
      ...course,
      instructor: createdInstructors[index % createdInstructors.length]._id
    }));

    // Create courses
    const createdCourses = await Course.insertMany(coursesWithInstructors);
    console.log(`Created ${createdCourses.length} courses`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();