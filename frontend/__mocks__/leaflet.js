class Icon {}
Icon.Default = {
  prototype: {},
  mergeOptions: jest.fn(),
};

const latLngBounds = jest.fn(() => ({
  extend: jest.fn(),
  isValid: jest.fn(() => true),
}));

const L = {
  Icon,
  icon: jest.fn(() => ({})),
  latLngBounds,
};

module.exports = L;
module.exports.default = L;
