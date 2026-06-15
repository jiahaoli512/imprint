const { Schema, model } = require('mongoose');

const mapMarkersSchema = new Schema({
  _id: { type: String, default: 'singleton' },
  points: { type: [[Number]], default: [] },
}, { timestamps: true });

module.exports = model('MapMarkers', mapMarkersSchema);
