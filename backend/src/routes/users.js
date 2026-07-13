const router = require('express').Router();

// Thin aggregator: all still one "users" resource at /api/users, but split by
// sub-domain into its own file each — auth (register/login/verify),
// account (password reset/change, logout-all, export), profile (CRUD/search)
// — mirroring the authService/passwordResetService/profileService split that
// already existed at the service layer. Order matters only where two routers
// could match the same path+method; none do here (each file owns disjoint
// paths), so mount order is unconstrained.
router.use(require('./authRoutes'));
router.use(require('./accountRoutes'));
router.use(require('./profileRoutes'));

module.exports = router;
