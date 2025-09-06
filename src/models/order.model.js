import mongoose, {Schema} from "mongoose";

const OrderSchema = new Schema({
  razorpayOrderId: {
    type: String,
    required: false // Made optional since we removed Razorpay
  },
  amount: {
    type: Number,
    required: true,
  },
  originalAmount: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: "INR"
  },
  paymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String
  },
  receipt: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "failed", "paid"],
    default: "pending"
  },
  
  // Tracking information
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true // allows multiple null values
  },
  
  notes: {
    type: String,
  },
  
  // Status timestamps
  shippedAt: {
    type: Date,
  },
  
  deliveredAt: {
    type: Date,
  },
  
  cancelledAt: {
    type: Date,
  },

  shippingDetails: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
  },

  items: [
    {
      name: String,
      qty: Number,
      price: Number,
    },
  ],

  shippingInfo: {
    warehouse: {
      lat: Number,
      lng: Number,
      address: String,
    },
    destination: {
      lat: Number,
      lng: Number,
      address: String,
      formatted_address: String,
      pincode: String,
      state: String,
      city: String,
    },
    zone: String,
    distance: String,
    duration: String,
    estimatedDeliveryDays: Number,
    shippingCost: Number,
    method: String,
    note: String,
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
}, {timestamps: true})

export const Order = mongoose.model("Order", OrderSchema)