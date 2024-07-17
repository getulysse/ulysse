/* eslint class-methods-use-this: 0 */
const TestSequencer = require('@jest/test-sequencer').default;

class AlphabeticalSequencer extends TestSequencer {
    sort(tests) {
        return tests.sort((testA, testB) => {
            const nameA = testA.path.toUpperCase();
            const nameB = testB.path.toUpperCase();
            return nameA.localeCompare(nameB);
        });
    }
}

module.exports = AlphabeticalSequencer;
