/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable no-plusplus */
const randomstring = require('randomstring')
const jwt = require('jsonwebtoken')
const {
  Passenger,
  Booking,
  PassengerContact,
  PassengerBooking,
  Flight,
  Airline,
  Airplane,
  FlightClass,
  FlightType,
  Airport,
  BookingStatus,
} = require('../../models')
const { createNotification } = require('./notificationController')
const { flightInc, flightAttr } = require('./flightController')

const flight2Inc = [
  {
    model: Airline,
  },
  {
    model: Airplane,
  },
  {
    model: FlightClass,
  },
  {
    model: FlightType,
  },
  {
    model: Airport,
    as: 'departureAirport',
  },
  {
    model: Airport,
    as: 'arrivalAirport',
  },
]

const bookingInc = [
  {
    model: Flight,
    as: 'departureFlight',
    attributes: flightAttr,
    include: flightInc,
  },
  {
    model: Flight,
    as: 'returnFlight',
    attributes: flightAttr,
    include: flight2Inc,
  },
  {
    model: Passenger,
    through: {
      attributes: [],
    },
  },
  {
    model: PassengerContact,
  },
]

const handleListBookings = async (req, res) => {
  try {
    const booking = await Booking.findAll({
      include: bookingInc,
    })
    res.status(200).json({ booking })
  } catch (err) {
    res.status(404).json({
      error: {
        name: err.name,
        message: err.message,
      },
    })
  }
}

const handleBookFlight = async (req, res) => {
  try {
    const user = userToken(req)
    const {
      contactTitle,
      contactFirstName,
      contactLastName,
      contactPhone,
      contactEmail,
      flight1Id,
      flight2Id,
    } = req.body

    const passengerContact = await PassengerContact.create({
      title: contactTitle,
      firstName: contactFirstName,
      lastName: contactLastName,
      phone: contactPhone,
      email: contactEmail,
    })

    const passengerData = req.body.passenger

    const passenger = await Passenger.bulkCreate(passengerData)

    const flightPrice = await Promise.all(
      [flight1Id, flight2Id].filter((e) => e !== undefined).map(getPrice),
    )

    const passengerQty = passenger.length
    const totalPrice = flightPrice
      .map((e) => e * passengerQty)
      .reduce((a, b) => a + b)

    const userId = user !== null ? user.id : user
    const booking = await Booking.create({
      bookingCode: randomstring.generate({ length: 10, charset: 'alphabetic' }),
      flight1Id,
      flight2Id,
      roundtrip: flight2Id != null,
      userId,
      passengerContactId: passengerContact.id,
      passengerQty,
      totalPrice,
      status: 'Waiting',
    })

    const passengerBookingData = passenger.map((e) => ({
      passengerId: e.id,
      bookingId: booking.id,
    }))

    const passengerBooking = await PassengerBooking.bulkCreate(
      passengerBookingData,
    )

    if (userId) {
      await createNotification(
        'Waiting for payment',
        booking.bookingCode,
        booking.id,
        false,
        userId,
      )
    }
    const response = {
      booking,
      passengerContact,
      passenger,
      passengerBooking,
    }
    const bookingDetails = await Booking.findByPk(booking.id)
    req.payload = bookingDetails
    res.status(200).json(response)
  } catch (err) {
    console.log(err)
    res.status(422).json({
      error: {
        name: err.name,
        message: err.message,
      },
    })
  }
}

const handleSearchBookingByCode = async (req, res) => {
  try {
    const booking = await Booking.findAll({
      where: {
        bookingCode: req.query.bookingcode,
      },
      include: bookingInc,
    })
    res.status(200).json({ booking })
  } catch (err) {
    res.status(404).json({
      error: {
        name: err.name,
        message: err.message,
      },
    })
  }
}

const handleGetUserBooking = async (req, res) => {
  const user = req.user

  try {
    if (user !== null) {
      const booking = await Booking.findAll({
        where: { userId: req.user.id },
        include: bookingInc,
      })
      res.status(200).json({ booking })
    } else {
      res.status(404).json({
        error: {
          message: 'you have too be logged in see your booking',
        },
      })
    }
  } catch (err) {
    res.status(404).json({
      error: {
        name: err.name,
        message: err.message,
      },
    })
  }
}

const handleDeleteBooking = async (req, res) => {
  await Booking.destroy({ where: { id: req.params.id } })
  res.status(204).end()
}

const historyBooking = async (req, res) => {
  try {
    const history = await Booking.findAll({
      where: { userId: req.user.id },
      include: bookingInc,
    })
    res.status(200).json({ history })
  } catch (err) {
    res.status(404).json({
      error: {
        name: err.name,
        message: err.message,
      },
    })
  }
}

const userToken = async (req) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1]
    const payload = decodeToken(token)
    console.log(payload)
    return payload
  } catch (error) {
    console.error(error)
    const payload = null
    return payload
  }
}

const decodeToken = (token) => {
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
}

const baggageMultiplier = (baggage) => {
  if (baggage === null) {
    result = 0
  }
  const multiplier = [20, 0]
  while (baggage !== multiplier[0] && multiplier[1] < 10) {
    multiplier[0] += 5
    multiplier[1] += 10
    while (baggage !== multiplier[0]) {
      multiplier[0] += 5
      multiplier[1] += 5
    }
  }
  let result = multiplier[1] / 100
  return result
}

const countBaggagePrice = (passengerBaggages, flightPrice, passengerQty) => {
  let result = 0

  for (let i = 0; i < passengerQty; i++) {
    if (
      typeof passengerBaggages[i][1] === 'undefined' &&
      typeof flightPrice[1] === 'undefined'
    ) {
      result += passengerBaggages[i] * flightPrice[0]
    } else {
      for (let j = 0; j < passengerQty; j++) {
        result += passengerBaggages[i][j] * flightPrice[i]
      }
    }
  }

  return result
}

const getPrice = async (flightId) => {
  const flight = await Flight.findByPk(flightId)
  const result = flight.price
  return result
}

module.exports = {
  handleListBookings,
  handleBookFlight,
  handleGetUserBooking,
  handleSearchBookingByCode,
  handleDeleteBooking,
  historyBooking,
}
