const mongoose = require('mongoose');

const AdminAuditSchema = new mongoose.Schema({
  // admin can be an ObjectId or a string identifier in dev (use Mixed)
  admin: { type: mongoose.Schema.Types.Mixed, required: false },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: false },
  before: { type: Object, default: null },
  after: { type: Object, default: null },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminAudit', AdminAuditSchema);
