/****************ITE5315 – ProjectI declare that this assignment is my own work in accordance with Humber AcademicPolicy.
 * No part of this assignment has been copied manually or electronically from any othersource(including web sites)
 * or distributed to other students.
 * Name: Yash Prasad    Student ID: N01552931        Date: 7/04/24
 * ***************************/
const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  // name: String,
  // borough: String,
  // cuisine: String,
  // grades: [Object],
  // restaurant_id: String,

  //comment from here
  address: {
    building: String,
    street: String,
    zipcode: String,
    coord: [Number], // Assuming coordinates are stored as an array of numbers
  },
  borough: String,
  cuisine: String,
  grades: [
    {
      date: Date,
      grade: String,
      score: Number,
    },
  ],
  name: String,
  restaurant_id: String,
  //till here


});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
