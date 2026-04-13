const express = require('express');
const router = express.Router();

const validateSchema = require('../middlewares/validateSchema');
const { loginSchema, registerSchema } = require('../schemas/auth.schema');
const { login, register } = require('../controllers/auth.controller');

router.post('/login', validateSchema(loginSchema), login);
router.post('/register', validateSchema(registerSchema), register);

module.exports = router;
