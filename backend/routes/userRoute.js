import express from 'express';
import { loginUser,registerUser,adminLogin,getProfile,updateMeasurements,getMeasurements } from '../controllers/userController.js';
import authUser from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/admin',adminLogin)
userRouter.get('/profile', authUser, getProfile);
userRouter.post('/measurements', authUser, updateMeasurements);
userRouter.get('/measurements', authUser, getMeasurements);

export default userRouter;