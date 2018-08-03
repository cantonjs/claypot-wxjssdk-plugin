import { createApp } from 'claypot';
import JsSHA from 'jssha';
import invariant from 'invariant';
import tap from './tap';
import { isFunction, now } from './utils';
import request from './request';
import { name as packageName } from '../package.json';

export default class WxjssdkClaypotPlugin {
	constructor(options = {}) {
		const {
			appId, // Weixin APP ID
			secret, // Weixin secret
			pathName = '/api/jssdk',
			urlKey = 'url', // the query key of `url`
			fetchTicket: customFetchTicket,
			fetchToken: customFetchToken,
			onGetToken,
			onSetToken,
			onGetTicket,
			onSetTicket,
			onError,
			validURL,
			tokenURL = 'https://api.weixin.qq.com/cgi-bin/token',
			ticketURL = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
		} = options;

		const useCustomFetchTicket = isFunction(customFetchTicket);
		const useCustomFetchToken = isFunction(customFetchToken);

		invariant(appId, `[${packageName}] missing param "appId"`);
		invariant(secret || useCustomFetchTicket || useCustomFetchToken,
			`[${packageName}] You must declare at least one of "secret", "fetchTicket" or "fetchToken"`);

		// noncestr
		const createNonceStr = () => Math.random().toString(36).substr(2, 15);

		// token
		const defaultFetchToken = async () => {
			const queryStirng = `grant_type=client_credential&appid=${appId}&secret=${secret}`;
			return request(`${tokenURL}?${queryStirng}`);
		};

		// ticket
		const defaultFetchTicket = async () => {
			const token = await tap({
				name: 'access_token',
				get: onGetToken,
				set: onSetToken,
				fetch: useCustomFetchToken ? customFetchToken : defaultFetchToken,
			});

			const queryStirng = `access_token=${token}&type=jsapi`;
			return request(`${ticketURL}?${queryStirng}`);
		};

		// signature
		const calcSignature = (ticket, noncestr, ts, url) => {
			const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${ts}&url=${url}`;
			const sha = new JsSHA('SHA-1', 'TEXT');
			sha.update(str);
			return sha.getHash('HEX');
		};

		const fetchToken = async (ctx, next) => {
			const { path } = ctx.request;

			// if (path !== validPath) {
			// 	await next();
			// 	return;
			// }

			try {
				const timestamp = now();
				const nonceStr = createNonceStr();
				const url = ctx.query[urlKey];

				if (isFunction(validURL) && !validURL(url)) {
					throw new Error(`${url} is NOT a valid URL`);
				}

				const ticket = await tap({
					name: 'ticket',
					timestamp,
					get: onGetTicket,
					set: onSetTicket,
					fetch: useCustomFetchTicket ? customFetchTicket : defaultFetchTicket,
					arg: url,
				});

				const signature = calcSignature(ticket, nonceStr, timestamp, url);
				return { appId, timestamp, nonceStr, signature };
			}
			catch (error) {
				if (isFunction(onError)) { onError.call(ctx, error, ctx, next); }
				else {
					const { message = 'ERROR', code } = error;
					const err = new Error(message);
					err.code = code;
					ctx.throw(400, err);
				}
			}
		};

		this._pathName = pathName;
		this._fetchToken = fetchToken;
	}

	middleware(parent) {
		const { _pathName } = this;
		const app = createApp();

		app.use(async (ctx, next) => {

			const res = await this._fetchToken(ctx, next);
			ctx.body = res;
		});
		parent.mount(_pathName, app);
	}
}
