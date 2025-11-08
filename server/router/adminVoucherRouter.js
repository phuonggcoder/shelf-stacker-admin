const express = require('express');
const Voucher = require('../models/voucher');
const AdminAudit = require('../models/adminAudit');
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

function isAdmin(req, res, next) {
  const roles = Array.isArray(req.user.roles) ? req.user.roles : (req.user.role ? [req.user.role] : []);
  if (!roles.includes('admin')) return res.status(403).json({ msg: 'Forbidden' });
  next();
}

// List vouchers with pagination & filters
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, q, is_active, include_deleted } = req.query;
    // include_deleted: 'true' -> include both deleted and non-deleted
    // include_deleted: 'only' -> only deleted
  let filter = {};
  console.debug('[adminVoucherRouter] list filter:', { include_deleted, q, is_active });
    if (include_deleted !== 'true') {
      // default: exclude deleted
      filter.is_deleted = { $ne: true };
    }
    if (include_deleted === 'only') filter = { is_deleted: true };
    if (q) filter.$or = [ { voucher_id: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') } ];
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    const total = await Voucher.countDocuments(filter);
    const vouchers = await Voucher.find(filter)
      .skip((page-1)*limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ total, page: Number(page), limit: Number(limit), vouchers });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get voucher detail
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid id' });
    const voucher = await Voucher.findById(id);
    if (!voucher) return res.status(404).json({ msg: 'Not found' });
    res.json(voucher);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Create voucher
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const payload = req.body;
    const v = new Voucher(payload);
    await v.save();
    await AdminAudit.create({ admin: req.user.sub, action: 'create', resource: 'voucher', resourceId: v._id, after: v.toObject() });
    res.status(201).json(v);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Update voucher
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const before = await Voucher.findById(id);
    if (!before) return res.status(404).json({ msg: 'Not found' });
    const updated = await Voucher.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    await AdminAudit.create({ admin: req.user.sub, action: 'update', resource: 'voucher', resourceId: id, before: before.toObject(), after: updated.toObject() });
    res.json(updated);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Soft delete
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const before = await Voucher.findById(id);
    if (!before) return res.status(404).json({ msg: 'Not found' });
    before.is_deleted = true;
    await before.save();
    await AdminAudit.create({ admin: req.user.sub, action: 'soft-delete', resource: 'voucher', resourceId: id, before: before.toObject(), note: req.body.note || '' });
    res.json({ msg: 'Soft deleted' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Archive (alias for soft-delete) via POST to match FE contract
router.post('/:id/archive', auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const before = await Voucher.findById(id);
    if (!before) return res.status(404).json({ msg: 'Not found' });
    before.is_deleted = true;
    await before.save();
    await AdminAudit.create({ admin: req.user.sub, action: 'archive', resource: 'voucher', resourceId: id, before: before.toObject(), note: req.body.note || '' });
    res.json({ msg: 'Archived' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Bulk archive (accepts { ids: [..] })
router.post('/bulk-archive', auth, isAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const archived = [];
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      const before = await Voucher.findById(id);
      if (!before) continue;
      before.is_deleted = true;
      await before.save();
      await AdminAudit.create({ admin: req.user.sub, action: 'archive', resource: 'voucher', resourceId: id, before: before.toObject(), note: 'bulk archive' });
      archived.push(id);
    }
    res.json({ msg: 'Bulk archived', count: archived.length, ids: archived });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Restore archived voucher
router.post('/:id/restore', auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid id' });
    const v = await Voucher.findById(id);
    if (!v) return res.status(404).json({ msg: 'Not found' });
    const before = v.toObject();
    v.is_deleted = false;
    await v.save();
    await AdminAudit.create({ admin: req.user.sub, action: 'restore', resource: 'voucher', resourceId: id, before, after: v.toObject(), note: req.body.note || '' });
    res.json({ msg: 'Restored', id });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Hard delete (permanent)
router.delete('/:id/hard', auth, isAdmin, async (req, res) => {
  try {
    const roles = Array.isArray(req.user.roles) ? req.user.roles : (req.user.role ? [req.user.role] : []);
    if (!roles.includes('superadmin')) return res.status(403).json({ msg: 'Forbidden: superadmin required' });
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid id' });
    const v = await Voucher.findById(id);
    if (!v) return res.status(404).json({ msg: 'Not found' });
    const before = v.toObject();
    await Voucher.deleteOne({ _id: id });
    await AdminAudit.create({ admin: req.user.sub, action: 'hard-delete', resource: 'voucher', resourceId: id, before, note: req.body.note || '' });
    res.json({ msg: 'Permanently deleted', id });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Bulk hard delete
router.post('/bulk-hard-delete', auth, isAdmin, async (req, res) => {
  try {
    const roles = Array.isArray(req.user.roles) ? req.user.roles : (req.user.role ? [req.user.role] : []);
    if (!roles.includes('superadmin')) return res.status(403).json({ msg: 'Forbidden: superadmin required' });
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const deleted = [];
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      const v = await Voucher.findById(id);
      if (!v) continue;
      const before = v.toObject();
      await Voucher.deleteOne({ _id: id });
      await AdminAudit.create({ admin: req.user.sub, action: 'hard-delete', resource: 'voucher', resourceId: id, before, note: 'bulk hard delete' });
      deleted.push(id);
    }
    res.json({ msg: 'Bulk hard deleted', count: deleted.length, ids: deleted });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Recalculate usage
router.post('/:id/recalculate-usage', auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const voucher = await Voucher.findById(id);
    if (!voucher) return res.status(404).json({ msg: 'Not found' });
    const before = voucher.toObject();
    // Normalize used_by and recalc usage_count
    let total = 0;
    if (Array.isArray(voucher.used_by)) {
      voucher.used_by = voucher.used_by.map(u => ({ user: u.user, order: u.order, used_at: u.used_at, discount_amount: u.discount_amount, count: Number(u.count) || 1 }));
      total = voucher.used_by.reduce((s, x) => s + (x.count || 0), 0);
      voucher.usage_count = total;
      await voucher.save();
      await AdminAudit.create({ admin: req.user.sub, action: 'recalc-usage', resource: 'voucher', resourceId: id, before, after: voucher.toObject() });
    }
    res.json({ msg: 'Recalculated', usage_count: voucher.usage_count });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
