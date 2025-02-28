const siteRouter = require('./site');
const vrRouter = require('./vr'); // Thêm router cho /vr

function route(app) {
    app.use('/vr', vrRouter); // Thêm route /vr
    app.use('/', siteRouter);
}

module.exports = route;
