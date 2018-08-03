
import weixinJSSDK from '../src';
import request from '../src/request';
import { startServer, stopServer, createConfig, origin } from './utils';

describe('claypot wxjssdk plugin', () => {
	afterEach(stopServer);

	test('should throw error that requires `appId`', async () => {
		await startServer();
		expect(weixinJSSDK).toThrow();
	});

	test('should throw error that requires at least one of `secret`, `fetchTicket` or `fetchToken`', async () => {
		await startServer({ appId: 'asdf' });
		expect(weixinJSSDK).toThrow();
	});

	test('should response a valid object', async () => {
		const config = createConfig({ secret: 'biubiubiu' });
		const { urlRoot } = await startServer(config);
		const res = await request(`${urlRoot}/api/jssdk?url=http://awesome.com`);
		expect(res).toHaveProperty('appId', config.appId);
		expect(res).toHaveProperty('timestamp');
		expect(res).toHaveProperty('nonceStr');
		expect(res).toHaveProperty('signature');
	});

	test('should trigger `onError` if fetch failed', async () => {
		const onError = jest.fn();
		const config = createConfig({
			secret: 'biubiubiu',
			ticketURL: `${origin}/failed`,
			onError,
		});
		const { urlRoot } = await startServer(config);
		await request(`${urlRoot}/api/jssdk?url=http://awesome.com`);
		expect(onError.mock.calls.length).toBe(1);
	});

	test('should trigger `onError` if server error', async () => {
		const onError = jest.fn();
		const config = createConfig({
			secret: 'biubiubiu',
			ticketURL: `${origin}/error`,
			onError,
		});
		const { urlRoot } = await startServer(config);
		await request(`${urlRoot}/api/jssdk?url=http://awesome.com`);
		expect(onError.mock.calls.length).toBe(1);
	});

	test('should not handle if `pathName` string doesn\'t match', async () => {
		const config = createConfig({ secret: 'biubiubiu' });
		const { urlRoot } = await startServer(config);
		try {
			await request(`${urlRoot}/api/ajssdk?url=http://awesome.com`);
		}
		catch (err) {
			expect(err.toString()).toBe('Error: Not Found');
		}

	});

	// 2018-8-3 can't support pathName() right now;
	// test('should not handle if `pathName()` doesn\'t match', async () => {
	// 	const pathName = jest.fn(() => {
	// 		return { pathName: '/a' };
	// 	});
	// 	const config = createConfig({
	// 		secret: 'biubiubiu',
	// 		pathName
	// 	});
	// 	const { urlRoot } = await startServer(config);
	// 	try {
	// 		await request(`${urlRoot}/api/ajssdk?url=http://awesome.com`);
	// 	}
	// 	catch (err) {
	// 		expect(pathName.mock.calls.length).toBe(1);
	// 		expect(err.toString()).toBe('Error: Not Found');
	// 	}
	// });

	// test('should throw error if `validURL()` returns `false`', async () => {
	// 	const validURL = jest.fn((arg) => {
	// 		expect(arg).toBe(ctx);
	// 		return false;
	// 	});
	// 	const config = createConfig({ secret: 'biubiubiu', validURL });
	// 	const { urlRoot } = await startServer(config);

	// 	expect(validURL.mock.calls.length).toBe(1);
	// 	expect(ctx.status).toBe(400);
	// });

	// test('should work if `validURL()` returns `true`', async () => {
	// 	const validURL = jest.fn(() => true);
	// 	const config = createConfig({ secret: 'biubiubiu', validURL });
	// 	const { urlRoot } = await startServer(config);

	// 	expect(validURL.mock.calls.length).toBe(1);
	// });

	test('should trigger `onGetTicket()`', async () => {
		const url = 'http://awesome.com';
		const onGetTicket = jest.fn((arg) => {
			expect(arg).toBe(url);
			return Promise.resolve('fake_ticket');
		});
		const config = createConfig({
			secret: 'biubiubiu',
			onGetTicket,
		});
		const { urlRoot } = await startServer(config);
		const res = await request(`${urlRoot}/api/jssdk?url=http://awesome.com`);

		expect(res).toHaveProperty('appId', config.appId);
		expect(res).toHaveProperty('timestamp');
		expect(res).toHaveProperty('nonceStr');
		expect(res).toHaveProperty('signature');
		expect(onGetTicket.mock.calls.length).toBe(1);
	});

	test('should not trigger `onSetTicket()` if `onGetTicket()` returns a `ticket`', async () => {
		const url = 'http://awesome.com';
		const onGetTicket = jest.fn((arg) => {
			expect(arg).toBe(url);
			return Promise.resolve('fake_ticket');
		});
		const onSetTicket = jest.fn((ticket, expires_in) => {
			expect(typeof ticket).toBe('string');
			expect(typeof expires_in).toBe('number');
		});
		const config = createConfig({
			secret: 'biubiubiu',
			onGetTicket,
			onSetTicket,
		});
		const { urlRoot } = await startServer(config);

		await request(`${urlRoot}/api/jssdk?url=${url}`);

		expect(onSetTicket.mock.calls.length).toBe(0);
	});

	// test('should trigger `onSetTicket()` if `onGetTicket()` returns `falsy`', async () => {
	// 	const url = 'http://awesome.com';
	// 	const onGetTicket = () => false;
	// 	const onSetTicket = jest.fn((ticket, expires_in) => {
	// 		expect(typeof ticket).toBe('string');
	// 		expect(typeof expires_in).toBe('number');
	// 	});
	// 	const config = createConfig({
	// 		secret: 'biubiubiu',
	// 		onGetTicket,
	// 		onSetTicket,
	// 	});
	// 	const { urlRoot } = await startServer(config);

	// 	await request(`${urlRoot}/api/jssdk?url=${url}`);

	// 	expect(onSetTicket.mock.calls.length).toBe(1);
	// });

	// test('should use cache if `onSetTicket()` is called', async () => {
	// 	let cache;
	// 	const onGetTicket = jest.fn(() => cache);
	// 	const onSetTicket = jest.fn((ticket) => (cache = ticket));
	// 	const config = createConfig({
	// 		secret: 'biubiubiu',
	// 		onGetTicket,
	// 		onSetTicket,
	// 	});
	// 	const { urlRoot } = await startServer(config);
	// 	expect(onGetTicket.mock.calls.length).toBe(2);

	// 	// the second time will use cache, so `onSetTicket` won't be triggered
	// 	expect(onSetTicket.mock.calls.length).toBe(1);
	// });


	test('should trigger `onGetToken()`', async () => {
		const url = 'http://awesome.com';
		const onGetToken = jest.fn(() => Promise.resolve('fake_token'));
		const config = createConfig({
			secret: 'biubiubiu',
			onGetToken,
		});
		const { urlRoot } = await startServer(config);

		await request(`${urlRoot}/api/jssdk?url=${url}`);

		expect(onGetToken.mock.calls.length).toBe(1);
	});

	test('should not trigger `onSetToken()` if `onGetToken()` returns a `ticket`', async () => {
		const url = 'http://awesome.com';
		const onGetToken = jest.fn(() => Promise.resolve('fake_token'));
		const onSetToken = jest.fn((ticket, expires_in) => {
			expect(typeof ticket).toBe('string');
			expect(typeof expires_in).toBe('number');
		});
		const config = createConfig({
			secret: 'biubiubiu',
			onGetToken,
			onSetToken,
		});
		const { urlRoot } = await startServer(config);

		await request(`${urlRoot}/api/jssdk?url=${url}`);

		expect(onSetToken.mock.calls.length).toBe(0);
	});

	// test('should trigger `onSetToken()` if `onGetToken()` returns `falsy`', async () => {
	// 	const onGetToken = () => false;
	// 	const onSetToken = jest.fn((ticket, expires_in) => {
	// 		expect(typeof ticket).toBe('string');
	// 		expect(typeof expires_in).toBe('number');
	// 	});
	// 	const config = createConfig({
	// 		secret: 'biubiubiu',
	// 		onGetToken,
	// 		onSetToken,
	// 	});
	// 	const { urlRoot } = await startServer(config);

	// 	expect(onSetToken.mock.calls.length).toBe(1);
	// });

	// test('should use cache if `onSetToken()` is called', async () => {
	// 	let cache;
	// 	const onGetToken = jest.fn(() => cache);
	// 	const onSetToken = jest.fn((ticket) => (cache = ticket));
	// 	const config = createConfig({
	// 		secret: 'biubiubiu',
	// 		onGetToken,
	// 		onSetToken,
	// 	});
	// 	const { urlRoot } = await startServer(config);
	// 	expect(onGetToken.mock.calls.length).toBe(2);

	// 	// the second time will use cache, so `onSetToken` won't be triggered
	// 	expect(onSetToken.mock.calls.length).toBe(1);
	// });

	test('should call `fetchToken()`', async () => {
		let config = {};
		const url = 'http://awesome.com';
		const fetchToken = jest.fn(() => {
			const { appId, secret, tokenURL } = config;
			const queryStirng = `grant_type=client_credential&appid=${appId}&secret=${secret}`;
			return request(`${tokenURL}?${queryStirng}`);
		});
		config = createConfig({ fetchToken });
		const { urlRoot } = await startServer(config);

		await request(`${urlRoot}/api/jssdk?url=${url}`);

		expect(fetchToken.mock.calls.length).toBe(1);
	});

	test('should call `fetchTicket()`', async () => {
		let config = {};
		const url = 'http://awesome.com';
		const fetchTicket = jest.fn(() => {
			const { ticketURL } = config;
			const queryStirng = 'access_token=asdf&type=jsapi';
			return request(`${ticketURL}?${queryStirng}`);
		});
		config = createConfig({ fetchTicket });
		const { urlRoot } = await startServer(config);

		await request(`${urlRoot}/api/jssdk?url=${url}`);

		expect(fetchTicket.mock.calls.length).toBe(1);
	});

});
