const React = require('react');

const MapContainer = ({ children, style }) =>
  React.createElement('div', { style }, children);

const TileLayer = () => null;

const Marker = ({ children, title }) => React.createElement('div', { 'data-testid': 'map-marker', title }, children);

const Popup = ({ children }) => React.createElement('div', { 'data-testid': 'map-popup' }, children);

const useMap = jest.fn(() => ({
  fitBounds: jest.fn(),
}));

module.exports = { MapContainer, TileLayer, Marker, Popup, useMap };
