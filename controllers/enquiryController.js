const { Unit, Project,Booking } = require('../models');

const enquiryController = {
  // list a new enquiries
  async getEnquiries(req, res){
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      if (search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { message: { [Op.iLike]: `%${search}%` } }
        ];
      }
      const { count, rows } = await Booking.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit),
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name']
          }
        ]
      });
      
      res.json({
        success: true,
        enquiries: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      res.status(500).json({ success: false, message: 'Error fetching enquiries' });
    }
  },

  async updateEnquiryType(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.body;
      const allowedTypes = ['hot', 'warm', 'cold'];
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type' });
      }
      const booking = await Booking.findByPk(id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      booking.type = type;
      await booking.save();
      res.json({ success: true, booking });
    } catch (error) {
      console.error('Error updating enquiry type:', error);
      res.status(500).json({ success: false, message: 'Error updating enquiry type' });
    }
  }

};

module.exports = enquiryController; 