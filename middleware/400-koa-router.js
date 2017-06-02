
import Router from 'koa-router'

module.exports = (app) => {
	var r = new Router();

	r.get('/public/*', app.staticCache);

	r.get('/details', ctx => {
		console.dir(ctx);
		console.dir("IO")
		console.dir(app.io);
	})

	r.post('/login', (ctx, next) => {
		console.dir("IM DOIN DAT LOGIN THING NOW");
		return app.passport.authenticate('local', {
			successRedirect: '/public/index.html',
			failureRedirect: '/'
		})(ctx, next)
	});


	app.koa.use(r.routes());
	app.koa.use(r.allowedMethods());
}