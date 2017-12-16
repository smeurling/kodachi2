
import Router from 'koa-router'
import mount from 'koa-mount'

module.exports = (app) => {
	var r = new Router();

	r.get('/session', async ctx => {
        ctx.body = ctx.session_id; //Output session id.    
	})

    //Handle tasks
    r.use('/task', require('../router/task')(app).routes());

    r.use('/verifyEmail/:code', async (ctx, next) => {
        var code = ctx.params.code;

        await app.cypher('MATCH (u:User {verifyCode:{code}} SET u.verified = true');

        ctx.response.body = "Kontot har verifierats! ^_^";

    });
    
    app.koa.use(mount('/', require('koa-static')(__dirname + '/../../client/build/')))

	app.koa.use(r.routes());
	app.koa.use(r.allowedMethods());

}
