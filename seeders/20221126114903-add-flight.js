"use strict";
const randomString = require("randomstring");
const momentRandom = require("moment-random");
const moment = require("moment");
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamp = new Date();

    function RandomMinMax(min, max) {
      return Math.round(Math.floor(Math.random() * (max - min)) + min);
    }

    const generateFlights = (
      departureAirportId,
      arrivalAirportId,
      duration,
      flightTypeId
    ) => {
      const currentDate = moment();
      const randomDate = currentDate
        .add(RandomMinMax(1, 365), "days")
        .format("YYYY-MM-DD");
      const randomTime = moment().hour(RandomMinMax(1, 12));
      const dur = moment.utc(duration, "hh:mm").format("hh:mm");

      return {
        flightCode: `GA-${randomString.generate({
          length: 3,
          charset: "numeric",
        })}`,
        airlineId: 1,
        airplaneId: 1,
        departureAirportId,
        arrivalAirportId,
        departureDate: randomDate,
        duration: dur,
        arrivalDate: randomDate,
        departureTime: moment(randomTime).format("hh:mm"),
        arrivalTime: moment(randomTime)
          .add(moment.duration(duration))
          .format("hh:mm"),
        flightTypeId,
        flightClassId: 1,
        price: RandomMinMax(5, 15) * 100000,
        baggage: RandomMinMax(15, 25),
        isAvailable: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    };

    const airports = [5945, 5793, 5798, 5780];

    let data = [];
    for (let i = 0; i < 10; i++) {
      airports.forEach((departureAirportId) => {
        airports.forEach((arrivalAirportId) => {
          if (departureAirportId !== arrivalAirportId) {
            data.push(
              generateFlights(departureAirportId, arrivalAirportId, "01:30", 1)
            );
          }
        });
      });
    }

    await queryInterface.bulkInsert("Flights", data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Flights", null, {
      truncate: true,
      cascade: true,
      restartIdentity: true,
    });
  },
};
