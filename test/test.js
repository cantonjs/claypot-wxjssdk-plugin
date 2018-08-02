
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

});
