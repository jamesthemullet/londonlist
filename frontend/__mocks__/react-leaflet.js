const React = require('react');

const MapContainer = ({ children, style, 'aria-label': ariaLabel }) =>
  React.createElement('div', { 'data-testid': 'map-container', style, 'aria-label': ariaLabel }, children);

const TileLayer = () => null;

const Marker = ({ children }) => React.createElement('div', { 'data-testid': 'map-marker' }, children);

const Popup = ({ children }) => React.createElement('div', { 'data-testid': 'map-popup' }, children);

const useMap = jest.fn(() => ({
  fitBounds: jest.fn(),
}));

module.exports = { MapContainer, TileLayer, Marker, Popup, useMap };
