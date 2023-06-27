/* eslint-disable */
import { Router } from 'express';
import {
  isAdmin,
  isSeller,
  isBuyer,
} from '../middleware/roles.js';
import { getAllNotifications, markNotificationAsRead, deleteNotification } from '../controller/notificationController.js';

const router = Router();
router.get('/buyer/notification',isBuyer, getAllNotifications);
router.put('/buyer/:notificationId', isBuyer, markNotificationAsRead);
router.delete('/buyer/:notificationId', isBuyer, deleteNotification);
//seller
router.get('/seller/notification',isSeller, getAllNotifications);
router.put('/seller/:notificationId', isSeller, markNotificationAsRead);
router.delete('/seller/:notificationId', isSeller, deleteNotification);
//admin
router.get('/admin/notification',isAdmin, getAllNotifications);
router.put('/admin/:notificationId', isAdmin, markNotificationAsRead);
router.delete('/admin/:notificationId', isAdmin, deleteNotification);

export default router;

