import Jasmine from 'jasmine';
import path from 'path';

const jasmine = new Jasmine();

// Configure jasmine manually, but don't let it load files
jasmine.loadConfig({
    spec_dir: 'spec',
    spec_files: [],
    helpers: [],
    random: false,
    stopSpecOnExpectationFailure: false
});

// Manually load helpers and specs using require (handled by ts-node)
// We need to use absolute paths or relative to this file
try {
    require('./helpers/setup');
    require('./services/EnterpriseImportService.spec');

    jasmine.execute();
} catch (e) {
    console.error(e);
    process.exit(1);
}
