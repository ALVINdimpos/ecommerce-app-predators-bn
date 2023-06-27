/* eslint-disable */
import { Router } from 'express';
import {
  isAdmin,
  isSeller,
  isBuyer,
} from '../middleware/roles.js';
import { getAllNotifications, markNotificationAsRead, deleteNotification ,markAllAsRead} from '../controller/notificationController.js';

const router = Router();
router.get('/buyer/notification',isBuyer, getAllNotifications);
router.put('/buyer/:notificationId', isBuyer, markNotificationAsRead);
router.delete('/buyer/:notificationId', isBuyer, deleteNotification);
router.put('/buyer/mark-all-as-read', isBuyer, markAllAsRead)
//seller
router.get('/seller/notification',isSeller, getAllNotifications);
router.put('/seller/:notificationId', isSeller, markNotificationAsRead);
router.delete('/seller/:notificationId', isSeller, deleteNotification);
router.put('/seller/mark-all-as-read', isSeller, markAllAsRead)

//admin
router.get('/admin/notification',isAdmin, getAllNotifications);
router.put('/admin/:notificationId', isAdmin, markNotificationAsRead);
router.delete('/admin/:notificationId', isAdmin, deleteNotification);
router.put('/admin/mark-all-as-read', isAdmin, markAllAsRead)

export default router;
