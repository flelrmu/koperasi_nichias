'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Add column `periode_id` (allowNull: true initially)
      await queryInterface.addColumn('arus_kas', 'periode_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'PeriodeKeuangan', // Corrected from table to model
          key: 'periode_id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 2. Fetch all transactions in arus_kas
      const transactions = await queryInterface.sequelize.query(
        'SELECT kas_id, tanggal FROM arus_kas',
        { 
          type: Sequelize.QueryTypes.SELECT, 
          transaction 
        }
      );

      // 3. Map and update each transaction
      for (const trx of transactions) {
        if (!trx.tanggal) continue;
        
        const date = new Date(trx.tanggal);
        const bulan = date.getMonth() + 1;
        const tahun = date.getFullYear();

        // Find existing PeriodeKeuangan for this month/year
        const periodResults = await queryInterface.sequelize.query(
          'SELECT periode_id FROM PeriodeKeuangan WHERE bulan = :bulan AND tahun = :tahun',
          {
            replacements: { bulan, tahun },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        let periode_id;
        if (periodResults && periodResults.length > 0) {
          periode_id = periodResults[0].periode_id;
        } else {
          // Create a new PeriodeKeuangan record
          const [insertedId] = await queryInterface.sequelize.query(
            'INSERT INTO PeriodeKeuangan (bulan, tahun, is_closed, createdAt, updatedAt) VALUES (:bulan, :tahun, false, NOW(), NOW())',
            {
              replacements: { bulan, tahun },
              type: Sequelize.QueryTypes.INSERT,
              transaction
            }
          );
          periode_id = insertedId;
        }

        // Update the arus_kas record with the mapped periode_id
        await queryInterface.sequelize.query(
          'UPDATE arus_kas SET periode_id = :periode_id WHERE kas_id = :kas_id',
          {
            replacements: { periode_id, kas_id: trx.kas_id },
            type: Sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove column
    await queryInterface.removeColumn('arus_kas', 'periode_id');
  }
};
