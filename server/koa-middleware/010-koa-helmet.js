module.exports = (app) => {
    app.koa.use(module.require("koa-helmet")());
};

