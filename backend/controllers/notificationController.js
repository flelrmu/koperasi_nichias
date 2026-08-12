const db = require('../models');
const Notifikasi = db.Notifikasi;


const getNotifications = async (req, res) => {
  try {
    const { user_id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; 
    const offset = (page - 1) * limit;

    const { count, rows } = await Notifikasi.findAndCountAll({
      where: { user_id },
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset,
    });

    const unreadCount = await Notifikasi.count({
      where: { user_id, is_read: false },
    });

    return res.status(200).json({
      success: true,
      data: rows,
      unreadCount,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil notifikasi.',
      error: error.message,
    });
  }
};





const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const notifikasi = await Notifikasi.findOne({
      where: { id, user_id },
    });

    if (!notifikasi) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan.',
      });
    }

    await notifikasi.update({ is_read: true });

    return res.status(200).json({
      success: true,
      message: 'Notifikasi ditandai sebagai sudah dibaca.',
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menandai notifikasi.',
      error: error.message,
    });
  }
};





const markAllAsRead = async (req, res) => {
  try {
    const { user_id } = req.user;

    await Notifikasi.update(
      { is_read: true },
      { where: { user_id, is_read: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'Semua notifikasi ditandai sebagai sudah dibaca.',
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menandai semua notifikasi.',
      error: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
