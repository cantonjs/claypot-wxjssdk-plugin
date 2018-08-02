export default class FakeJSSDKServer {
	middleware(app) {
		app.use(async (ctx, next) => {
			if (ctx.request.path === '/jssdk') {
				ctx.body = {
					openid: 'fake_open_id',
				};
				return;
			}
			await next();
		});
	}
}
