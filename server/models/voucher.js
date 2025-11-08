const mongoose = require('mongoose');

const UsedBySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  date: { type: Date, required: false },
  amount: { type: Number, required: false },
  count: { type: Number, default: 1 }
}, { _id: false });

const VoucherSchema = new mongoose.Schema({
  voucher_id: { type: String, required: true, unique: true },
  voucher_type: { type: String },
  discount_type: { type: String },
  discount_value: { type: Number },
  min_order_value: { type: Number },
  max_discount_value: { type: Number },
  usage_limit: { type: Number, default: 0 },
  max_per_user: { type: Number, default: 1 },
  start_date: { type: Date },
  end_date: { type: Date },
  description: { type: String },
  is_active: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  used_by: { type: [UsedBySchema], default: [] },
  usage_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', VoucherSchema);
