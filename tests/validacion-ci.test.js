const test = require('node:test');
const assert = require('node:assert/strict');

test('Validacion negativa del pipeline CI', () => {
    assert.equal(1, 2);
});
