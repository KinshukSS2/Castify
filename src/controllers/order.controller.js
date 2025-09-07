import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { Order } from "../models/order.model.js";
import axios from "axios";

// Warehouse location (you can change this to your actual warehouse coordinates)
const WAREHOUSE_LOCATION = {
  lat: 28.6139, // New Delhi coordinates (example)
  lng: 77.2090,
  address: "Your Warehouse Address, New Delhi, India"
};

// Function to get coordinates from address using Google Maps Geocoding API
const getCoordinatesFromAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: response.data.results[0].formatted_address
      };
    } else {
      throw new Error("Could not geocode address");
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
};

// Function to calculate distance and shipping cost using Google Maps Distance Matrix API
const calculateShippingDetails = async (originLat, originLng, destLat, destLng) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === "OK" && response.data.rows[0].elements[0].status === "OK") {
      const element = response.data.rows[0].elements[0];
      const distanceText = element.distance.text;
      const distanceValue = element.distance.value; // in meters
      const durationText = element.duration.text;
      const durationValue = element.duration.value; // in seconds

      // Convert distance to kilometers
      const distanceKm = distanceValue / 1000;

      return {
        distance: {
          text: distanceText,
          value: distanceValue,
          km: distanceKm
        },
        duration: {
          text: durationText,
          value: durationValue
        }
      };
    } else {
      throw new Error("Could not calculate distance");
    }
  } catch (error) {
    console.error("Distance calculation error:", error);
    throw error;
  }
};

// Function to calculate shipping cost based on distance
const calculateShippingCost = (distanceKm) => {
  let baseCost = 50; // Base shipping cost
  let perKmCost = 2; // Cost per kilometer
  let expeditedThreshold = 500; // Distance threshold for expedited shipping

  if (distanceKm <= 50) {
    // Local delivery
    return { 
      cost: baseCost, 
      zone: "Local",
      deliveryDays: 1
    };
  } else if (distanceKm <= 200) {
    // Regional delivery
    return { 
      cost: baseCost + (distanceKm * perKmCost), 
      zone: "Regional",
      deliveryDays: 2
    };
  } else if (distanceKm <= expeditedThreshold) {
    // National delivery
    return { 
      cost: baseCost + (distanceKm * perKmCost * 1.5), 
      zone: "National",
      deliveryDays: 3
    };
  } else {
    // Long distance delivery
    return { 
      cost: baseCost + (distanceKm * perKmCost * 2), 
      zone: "Long Distance",
      deliveryDays: 5
    };
  }
};

// Test Google Maps API function
export const testGoogleMapsAPI = async (req, res) => {
  try {
    // Test address
    const testAddress = "India Gate, New Delhi, India";
    
    console.log("Testing Google Maps API...");
    console.log("API Key:", process.env.GOOGLE_MAPS_API_KEY ? "Set" : "Not set");
    
    // Test geocoding
    const coordinates = await getCoordinatesFromAddress(testAddress);
    console.log("Geocoding result:", coordinates);
    
    // Test distance calculation
    const shippingDetails = await calculateShippingDetails(
      WAREHOUSE_LOCATION.lat,
      WAREHOUSE_LOCATION.lng,
      coordinates.lat,
      coordinates.lng
    );
    console.log("Distance calculation result:", shippingDetails);
    
    // Calculate shipping cost
    const shippingCost = calculateShippingCost(shippingDetails.distance.km);
    console.log("Shipping cost calculation:", shippingCost);
    
    res.status(200).json({
      success: true,
      message: "Google Maps API test successful",
      data: {
        testAddress,
        coordinates,
        shippingDetails,
        shippingCost
      }
    });
  } catch (error) {
    console.error("Google Maps API test failed:", error);
    res.status(500).json({
      success: false,
      message: "Google Maps API test failed: " + error.message,
      error: error.response?.data || error.message
    });
  }
};

// Function to calculate shipping cost based on pincode (without Google Maps)
const calculateShippingCostByPincode = (pincode, state) => {
  const pin = parseInt(pincode);
  
  // Delhi/NCR pincodes (110xxx, 122xxx, 201xxx)
  if ((pin >= 110000 && pin <= 110099) || (pin >= 122000 && pin <= 122999) || (pin >= 201000 && pin <= 201999)) {
    return { cost: 50, zone: "Local", deliveryDays: 1 };
  }
  
  // Major metro cities
  const metroPincodes = {
    Mumbai: [400000, 400999],
    Bangalore: [560000, 560999], 
    Chennai: [600000, 600999],
    Kolkata: [700000, 700999],
    Hyderabad: [500000, 500999],
    Pune: [411000, 411999]
  };
  
  for (const [city, [start, end]] of Object.entries(metroPincodes)) {
    if (pin >= start && pin <= end) {
      return { cost: 150, zone: `Metro - ${city}`, deliveryDays: 2 };
    }
  }
  
  // State-wise shipping
  const stateShipping = {
    "Maharashtra": { cost: 100, deliveryDays: 2 },
    "Karnataka": { cost: 120, deliveryDays: 3 },
    "Tamil Nadu": { cost: 130, deliveryDays: 3 },
    "Gujarat": { cost: 110, deliveryDays: 2 },
    "Rajasthan": { cost: 120, deliveryDays: 3 },
    "Uttar Pradesh": { cost: 100, deliveryDays: 2 },
    "West Bengal": { cost: 150, deliveryDays: 3 },
    "Kerala": { cost: 180, deliveryDays: 4 },
    "Andhra Pradesh": { cost: 140, deliveryDays: 3 },
    "Telangana": { cost: 140, deliveryDays: 3 }
  };
  
  if (stateShipping[state]) {
    return { 
      cost: stateShipping[state].cost, 
      zone: `State - ${state}`, 
      deliveryDays: stateShipping[state].deliveryDays 
    };
  }
  
  // Default for other states
  return { cost: 200, zone: "National", deliveryDays: 5 };
};

export const createOrder = async (req, res) => {
  try {
    const { amount, items, shippingDetails } = req.body;

    // Validation
    if (!amount || !items || !shippingDetails) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount, items, and shipping details are required" 
      });
    }

    // Calculate shipping using pincode-based system
    const shippingCalc = calculateShippingCostByPincode(
      shippingDetails.pincode, 
      shippingDetails.state
    );

    const fullAddress = `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state}, ${shippingDetails.pincode}, ${shippingDetails.country || 'India'}`;

    const shippingInfo = {
      warehouse: WAREHOUSE_LOCATION,
      destination: {
        address: fullAddress,
        pincode: shippingDetails.pincode,
        state: shippingDetails.state,
        city: shippingDetails.city
      },
      zone: shippingCalc.zone,
      estimatedDeliveryDays: shippingCalc.deliveryDays,
      shippingCost: shippingCalc.cost,
      method: "Pincode-based calculation"
    };

    // Create order with shipping information
    const order = await Order.create({
      amount: amount + shippingCalc.cost, // Add shipping cost to total
      originalAmount: amount,
      shippingCost: shippingCalc.cost,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      user: req.user._id,
      items,
      shippingDetails,
      shippingInfo,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      order,
      shippingInfo,
      message: "Order created successfully with shipping details"
    });
  } catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ 
      success: false, 
      message: "Order creation failed: " + error.message 
    });
  }
};

// Get shipping estimate endpoint (updated for pincode-based calculation)
export const getShippingEstimate = async (req, res) => {
  try {
    const { address, city, state, pincode, country = 'India' } = req.body;

    if (!address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Address, city, state, and pincode are required"
      });
    }

    const fullAddress = `${address}, ${city}, ${state}, ${pincode}, ${country}`;

    // Calculate shipping using pincode-based system
    const shippingCalc = calculateShippingCostByPincode(pincode, state);

    const shippingEstimate = {
      warehouse: WAREHOUSE_LOCATION,
      destination: {
        address: fullAddress,
        pincode: pincode,
        state: state,
        city: city
      },
      zone: shippingCalc.zone,
      estimatedDeliveryDays: shippingCalc.deliveryDays,
      shippingCost: shippingCalc.cost,
      method: "Pincode-based calculation"
    };

    res.status(200).json({
      success: true,
      shippingEstimate,
      message: "Shipping estimate calculated successfully"
    });
  } catch (error) {
    console.error("Error in getShippingEstimate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate shipping estimate: " + error.message
    });
  }
};

// GET version of shipping estimate for browser testing
export const getShippingEstimateGET = (req, res) => {
  // Sample data for testing
  const shippingEstimate = {
    warehouse: WAREHOUSE_LOCATION,
    destination: {
      address: "Sample Address, Mumbai, Maharashtra, 400058, India",
      pincode: "400058",
      state: "Maharashtra",
      city: "Mumbai"
    },
    zone: "Metro - Mumbai",
    estimatedDeliveryDays: 2,
    shippingCost: 150,
    method: "Pincode-based calculation"
  };

  res.status(200).json({
    success: true,
    shippingEstimate,
    message: "Sample shipping estimate (use POST with actual data)"
  });
};

// Simple test endpoint
export const testEndpoint = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Order routes are working!",
    timestamp: new Date().toISOString()
  });
};

// Get all orders for a user
export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { user: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "fullname email");

    const totalOrders = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: page * limit < totalOrders,
          hasPrev: page > 1,
        },
      },
      message: "Orders fetched successfully"
    });
  } catch (error) {
    console.error("Error in getUserOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders: " + error.message
    });
  }
};

// Get single order details
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "fullname email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user owns this order
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
      message: "Order details fetched successfully"
    });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order: " + error.message
    });
  }
};

// Update order status (admin function - but for demo, any user can update their own order)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, note } = req.body;

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid statuses: " + validStatuses.join(", ")
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Update order status
    order.status = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (note) {
      order.notes = note;
    }

    // Set timestamps based on status
    if (status === "shipped" && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    
    if (status === "delivered" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    if (status === "cancelled" && !order.cancelledAt) {
      order.cancelledAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: { order },
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status: " + error.message
    });
  }
};

// Track order by order ID or tracking number
export const trackOrder = async (req, res) => {
  try {
    const { identifier } = req.params; // Can be orderId or trackingNumber

    let order = await Order.findById(identifier).populate("user", "fullname email");
    
    if (!order) {
      // Try to find by tracking number
      order = await Order.findOne({ trackingNumber: identifier }).populate("user", "fullname email");
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user owns this order
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Create tracking timeline
    const trackingTimeline = [];
    
    if (order.createdAt) {
      trackingTimeline.push({
        status: "pending",
        timestamp: order.createdAt,
        title: "Order Placed",
        description: "Your order has been received and is being processed."
      });
    }

    if (order.status === "confirmed" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      trackingTimeline.push({
        status: "confirmed",
        timestamp: order.createdAt, // In real app, you'd have separate confirmationDate
        title: "Order Confirmed",
        description: "Your order has been confirmed and is being prepared."
      });
    }

    if (order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      trackingTimeline.push({
        status: "processing",
        timestamp: order.createdAt, // In real app, you'd have separate processingDate
        title: "Order Processing",
        description: "Your order is being prepared for shipment."
      });
    }

    if (order.shippedAt || order.status === "shipped" || order.status === "delivered") {
      trackingTimeline.push({
        status: "shipped",
        timestamp: order.shippedAt || order.createdAt,
        title: "Order Shipped",
        description: order.trackingNumber 
          ? `Your order has been shipped. Tracking number: ${order.trackingNumber}`
          : "Your order has been shipped."
      });
    }

    if (order.deliveredAt || order.status === "delivered") {
      trackingTimeline.push({
        status: "delivered",
        timestamp: order.deliveredAt || order.createdAt,
        title: "Order Delivered",
        description: "Your order has been successfully delivered."
      });
    }

    if (order.status === "cancelled") {
      trackingTimeline.push({
        status: "cancelled",
        timestamp: order.cancelledAt || order.updatedAt,
        title: "Order Cancelled",
        description: "Your order has been cancelled."
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order,
        trackingTimeline,
        estimatedDelivery: order.shippingInfo?.estimatedDeliveryDays 
          ? new Date(Date.now() + (order.shippingInfo.estimatedDeliveryDays * 24 * 60 * 60 * 1000))
          : null
      },
      message: "Order tracking information retrieved successfully"
    });
  } catch (error) {
    console.error("Error in trackOrder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track order: " + error.message
    });
  }
};

// Public track order endpoint (doesn't require authentication for basic info)
export const trackOrderPublic = async (req, res) => {
  try {
    const { identifier } = req.params; // Can be orderId or trackingNumber

    let order = await Order.findById(identifier).select('-user -paymentId -razorpaySignature');
    
    if (!order) {
      // Try to find by tracking number
      order = await Order.findOne({ trackingNumber: identifier }).select('-user -paymentId -razorpaySignature');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please check your Order ID or Tracking Number."
      });
    }

    // Create simplified tracking timeline for public view
    const trackingTimeline = [];
    
    if (order.createdAt) {
      trackingTimeline.push({
        status: "pending",
        timestamp: order.createdAt,
        title: "Order Placed",
        description: "Your order has been received and is being processed."
      });
    }

    if (order.status === "confirmed" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      trackingTimeline.push({
        status: "confirmed",
        timestamp: order.createdAt,
        title: "Order Confirmed",
        description: "Your order has been confirmed and is being prepared."
      });
    }

    if (order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      trackingTimeline.push({
        status: "processing",
        timestamp: order.createdAt,
        title: "Order Processing",
        description: "Your order is being prepared for shipment."
      });
    }

    if (order.shippedAt || order.status === "shipped" || order.status === "delivered") {
      trackingTimeline.push({
        status: "shipped",
        timestamp: order.shippedAt || order.createdAt,
        title: "Order Shipped",
        description: order.trackingNumber 
          ? `Your order has been shipped. Tracking number: ${order.trackingNumber}`
          : "Your order has been shipped."
      });
    }

    if (order.deliveredAt || order.status === "delivered") {
      trackingTimeline.push({
        status: "delivered",
        timestamp: order.deliveredAt || order.createdAt,
        title: "Order Delivered",
        description: "Your order has been successfully delivered."
      });
    }

    if (order.status === "cancelled") {
      trackingTimeline.push({
        status: "cancelled",
        timestamp: order.cancelledAt || order.updatedAt,
        title: "Order Cancelled",
        description: "Your order has been cancelled."
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: {
          _id: order._id,
          status: order.status,
          amount: order.amount,
          shippingCost: order.shippingCost,
          createdAt: order.createdAt,
          trackingNumber: order.trackingNumber,
          shippingDetails: order.shippingDetails,
          shippingInfo: order.shippingInfo,
          items: order.items
        },
        trackingTimeline,
        estimatedDelivery: order.shippingInfo?.estimatedDeliveryDays 
          ? new Date(Date.now() + (order.shippingInfo.estimatedDeliveryDays * 24 * 60 * 60 * 1000))
          : null
      },
      message: "Order tracking information retrieved successfully"
    });
  } catch (error) {
    console.error("Error in trackOrderPublic:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track order: " + error.message
    });
  }
};

