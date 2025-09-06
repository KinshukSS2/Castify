import { Router } from "express";
import { 
  createOrder,
  getShippingEstimate,
  getShippingEstimateGET,
  testGoogleMapsAPI,
  testEndpoint,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  trackOrder,
  trackOrderPublic
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Test endpoint (GET)
router.route("/test").get(testEndpoint);

// Test Google Maps API (GET)
router.route("/test-maps").get(testGoogleMapsAPI);

// Get shipping estimate (GET - for browser testing)
router.route("/shipping-estimate").get(getShippingEstimateGET);

// Get shipping estimate (POST - for actual use)
router.route("/shipping-estimate").post(getShippingEstimate);

// Public order tracking (no auth required)
router.route("/track-public/:identifier").get(trackOrderPublic);

// All other routes require authentication
router.use(verifyJWT);

// Get all orders for user
router.route("/my-orders").get(getUserOrders);

// Track order by ID or tracking number
router.route("/track/:identifier").get(trackOrder);

// Get specific order details
router.route("/:orderId").get(getOrderById);

// Update order status
router.route("/:orderId/status").patch(updateOrderStatus);

// Create new order
router.route("/create").post(createOrder);

export default router;
