import ContactMessage from '../models/ContactMessage.js';
import {
  buildDateRangeFilter,
  buildPagination,
  buildPaginationEnvelope,
  escapeRegex,
} from '../utils/adminListQuery.js';

// @desc    Submit contact form
// @route   POST /api/contact
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required'
      });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages (admin)
// @route   GET /api/contact
export const getMessages = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, skip } = buildPagination(query);
    const filter = {};

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }];
    }

    const createdAt = buildDateRangeFilter({
      from: query.createdFrom,
      to: query.createdTo,
    });
    if (createdAt) {
      filter.createdAt = createdAt;
    }

    const [total, messages] = await Promise.all([
      ContactMessage.countDocuments(filter),
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    res.json(buildPaginationEnvelope({ total, page, limit, data: messages }));
  } catch (error) {
    next(error);
  }
};

// @desc    Mark message as read (admin)
// @route   PUT /api/contact/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message (admin)
// @route   DELETE /api/contact/:id
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    next(error);
  }
};
