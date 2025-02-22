'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Passenger, {
        through: 'PassengerBooking',
        foreignKey: 'bookingId',
      })
      this.belongsTo(models.Flight, {
        foreignKey: 'flight1Id',
        as: 'departureFlight',
      })
      this.belongsTo(models.Flight, {
        foreignKey: 'flight2Id',
        as: 'returnFlight',
      })
      this.belongsTo(models.User, {
        foreignKey: 'userId',
      })
      this.belongsTo(models.PassengerContact, {
        foreignKey: 'passengerContactId',
      })
      this.hasMany(models.walletHistory, {
        foreignKey: 'bookingId',
      })
    }
  }
  Booking.init(
    {
      bookingCode: DataTypes.STRING,
      roundtrip: DataTypes.BOOLEAN,
      flight1Id: DataTypes.INTEGER,
      flight2Id: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      passengerContactId: DataTypes.INTEGER,
      status: DataTypes.ENUM('Waiting', 'Confirmed'),
      passengerQty: DataTypes.INTEGER,
      totalPrice: DataTypes.DOUBLE,
    },
    {
      sequelize,
      modelName: 'Booking',
    },
  )
  return Booking
}
