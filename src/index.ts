/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(_request: Request, env: Env): Promise<Response> {
		console.log("BASE_URL:", env.BASE_URL);
		console.log("GTM_ID:", env.GTM_ID);
		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;
