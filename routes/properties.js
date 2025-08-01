const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Property = require('../models/Property');
const { logger } = require('../utils/logger');

// Validation middleware
const validateProperty = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('type')
    .isIn(['residential', 'commercial', 'luxury', 'villa', 'apartment', 'office', 'retail', 'warehouse'])
    .withMessage('Invalid property type'),
  body('category')
    .isIn(['sale', 'rent', 'lease'])
    .withMessage('Invalid category'),
  body('price.amount')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('location.address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address is required'),
  body('location.area')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Area is required')
];

// Get all properties with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['residential', 'commercial', 'luxury', 'villa', 'apartment', 'office', 'retail', 'warehouse']),
  query('category').optional().isIn(['sale', 'rent', 'lease']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('location').optional().isString(),
  query('bedrooms').optional().isInt({ min: 0 }),
  query('featured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      category,
      minPrice,
      maxPrice,
      location,
      bedrooms,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { status: 'available' };

    if (type) query.type = type;
    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured === 'true';

    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.amount'].$lte = parseFloat(maxPrice);
    }

    if (location) {
      query['location.area'] = { $regex: location, $options: 'i' };
    }

    if (bedrooms) {
      query['specifications.bedrooms'] = { $gte: parseInt(bedrooms) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Property.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Increment view count
    await property.incrementViews();

    res.json({
      success: true,
      data: property
    });

  } catch (error) {
    logger.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new property
router.post('/', validateProperty, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const property = new Property(req.body);
    await property.save();

    logger.info(`New property created: ${property._id}`);

    res.status(201).json({
      success: true,
      data: property
    });

  } catch (error) {
    logger.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update property
router.put('/:id', validateProperty, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    logger.info(`Property updated: ${property._id}`);

    res.json({
      success: true,
      data: property
    });

  } catch (error) {
    logger.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    logger.info(`Property deleted: ${property._id}`);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get featured properties
router.get('/featured/list', async (req, res) => {
  try {
    const properties = await Property.find({
      featured: true,
      status: 'available'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    res.json({
      success: true,
      data: properties
    });

  } catch (error) {
    logger.error('Error fetching featured properties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get properties by location
router.get('/location/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const { limit = 20 } = req.query;

    const properties = await Property.find({
      'location.area': { $regex: area, $options: 'i' },
      status: 'available'
    })
    .sort({ featured: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: {
        properties,
        location: area,
        count: properties.length
      }
    });

  } catch (error) {
    logger.error('Error fetching properties by location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get similar properties
router.get('/:id/similar', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const similarProperties = await Property.find({
      _id: { $ne: property._id },
      type: property.type,
      'location.area': property.location.area,
      status: 'available'
    })
    .sort({ featured: -1, createdAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: similarProperties
    });

  } catch (error) {
    logger.error('Error fetching similar properties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get property statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Property.aggregate([
      {
        $group: {
          _id: null,
          totalProperties: { $sum: 1 },
          availableProperties: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          featuredProperties: {
            $sum: { $cond: ['$featured', 1, 0] }
          },
          avgPrice: { $avg: '$price.amount' },
          totalViews: { $sum: '$views' },
          totalInquiries: { $sum: '$inquiries' }
        }
      }
    ]);

    const typeStats = await Property.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price.amount' }
        }
      }
    ]);

    const locationStats = await Property.aggregate([
      {
        $group: {
          _id: '$location.area',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price.amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        byType: typeStats,
        byLocation: locationStats
      }
    });

  } catch (error) {
    logger.error('Error fetching property statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 