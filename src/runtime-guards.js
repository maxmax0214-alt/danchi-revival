/* global Phaser */

// DanchiScene creates residents before the side panel exists.
// addResident() refreshes the UI immediately, so provide temporary no-op
// display objects until createSidePanel() replaces them with real objects.
(() => {
  const createNoopDisplayObject = () => ({
    setFillStyle() { return this; },
    setColor() { return this; },
    setText() { return this; },
  });

  Object.defineProperties(Phaser.Scene.prototype, {
    startupButton: {
      configurable: true,
      writable: true,
      value: createNoopDisplayObject(),
    },
    startupButtonText: {
      configurable: true,
      writable: true,
      value: createNoopDisplayObject(),
    },
    startupText: {
      configurable: true,
      writable: true,
      value: createNoopDisplayObject(),
    },
  });
})();
