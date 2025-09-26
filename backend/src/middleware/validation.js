import Joi from "joi";

// AUTH VALIDATIONS
export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

// EVENT VALIDATIONS
export const validateCreateEvent = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(2000).required(),
    category: Joi.string().required(),
    location: Joi.string().required(),
    city: Joi.string().required(),
    price: Joi.number().min(0).required(),
    date: Joi.date().iso().required(),
    capacity: Joi.number().integer().min(1).required(),
    image: Joi.string().uri().optional(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

export const validateUpdateEvent = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().max(2000),
    category: Joi.string(),
    location: Joi.string(),
    city: Joi.string(),
    price: Joi.number().min(0),
    date: Joi.date().iso(),
    capacity: Joi.number().integer().min(1),
    image: Joi.string().uri(),
  }).min(1);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

// BOOKING VALIDATIONS
export const validateCreateBooking = (req, res, next) => {
  const schema = Joi.object({
    eventId: Joi.string().hex().length(24).required(),
    seats: Joi.number().integer().min(1).required(),
    paymentId: Joi.string().optional(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

// COMMENT VALIDATIONS
export const validateCreateComment = (req, res, next) => {
  const schema = Joi.object({
    eventId: Joi.string().hex().length(24).required(),
    comment: Joi.string().max(500).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

// USER PREFERENCES
export const validateUpdatePreferences = (req, res, next) => {
  const schema = Joi.object({
    interests: Joi.array().items(Joi.string()).optional(),
    notifications: Joi.boolean().optional(),
    bookmarks: Joi.array().items(Joi.string().hex().length(24)).optional(),
  }).min(1);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

// SEARCH/FILTER
export const validateSearchFilter = (req, res, next) => {
  const schema = Joi.object({
    category: Joi.string().optional(),
    city: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    keyword: Joi.string().optional(),
  });
  const { error } = schema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

// ADMIN DASHBOARD
export const validateAdminStatsQuery = (req, res, next) => {
  const schema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  });
  const { error } = schema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};
