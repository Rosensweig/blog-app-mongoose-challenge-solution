exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/blog-app';
exports.PORT = process.env.PORT || 8080;
exports.TEST_DATABASE_URL = 'mongodb://Rosensweig:ps4784@ds135519.mlab.com:35519/blog-test';