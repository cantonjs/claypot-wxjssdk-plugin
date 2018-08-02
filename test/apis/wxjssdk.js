export default {
	'/token': {
		get: {
			security: [],
			ctrl() {
				return {
					access_token: 'asdf',
					expires_in: 7200,
				};
			},
		},
	},
	'/getticket': {
		get: {
			security: [],
			ctrl() {
				return {
					access_token: 'asdf',
					expires_in: 7200,
				};
			},
		},
	},
	'/error': {
		get: {
			security: [],
			ctrl(ctx) {
				ctx.status = 500;
				return {
					message: 'ERROR',
				};
			},
		},
	},
	'/*': {
		get: {
			security: [],
			ctrl(ctx) {
				ctx.status = 404;
				return {
					message: 'NOT FOUND',
				};
			},
		},
	},

};
