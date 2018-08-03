import { startPure } from 'claypot';
import { resolve } from 'path';
import findPortSync from 'find-port-sync';

let server;
const port = findPortSync();
const host = '127.0.0.1';

export const origin = `http://${host}:${port}`;

export const createConfig = (config) => ({
	appId: 'asdf',
	tokenURL: `${origin}/api/wxjssdk/token`,
	ticketURL: `${origin}/api/wxjssdk/getticket`,
	...config,
});

export async function startServer(pluginConfig, claypotConfig) {
	const urlRoot = origin;
	server = await startPure({
		port,
		cwd: resolve('test'),
		execCommand: 'babel-register',
		production: false,
		plugins: [
			{
				module: '../src',
				options: pluginConfig
			},
			{
				module: 'claypot-restful-plugin',
				options: {
					controllersPath: 'apis',
					definitionsPath: 'defs',
					info: {
						version: '0.0.1',
					},
					securities: {
						defaults: 'X-ACCESS-TOKEN',
						wechatUser: 'X-ACCESS-TOKEN',
					},
					defaultSecurity: ['defaults'],
					pluralize: true,
				},
			},
		],
		...claypotConfig,
	});
	return {
		urlRoot,
	};
}

export async function stopServer() {
	if (server) {
		await server.close();
		startServer.server = null;
	}
}
