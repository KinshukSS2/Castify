import { Router } from "express";
import { 
  createOrder,
  getShippingEstimate,
  getShippingEstimateGET,
  testEndpoint,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  trackOrder,
  trackOrderPublic
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/test").get(testEndpoint);
router.route("/shipping-estimate").get(getShippingEstimateGET);
router.route("/shipping-estimate").post(getShippingEstimate);
router.route("/track-public/:identifier").get(trackOrderPublic);

router.use(verifyJWT);


router.route("/my-orders").get(getUserOrders);
router.route("/track/:identifier").get(trackOrder);
router.route("/:orderId").get(getOrderById);
router.route("/:orderId/status").patch(updateOrderStatus);
router.route("/create").post(createOrder);

export default router;
