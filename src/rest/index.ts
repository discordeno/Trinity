import { camelize, snakelize } from "@utils";
import { Routes, createRoutes } from "./routes.ts";
import { HttpMethod } from "./types.ts";
import { CreateMessage, FileContent } from "@type";

export const DISCORD_API_URL = "https://discord.com/api";

export const DISCORD_API_VERSION = 10;

const AUDIT_LOG_REASON_HEADER = "x-audit-log-reason";

// TODO: move this to a different file
export const VERSION = "0.0.0";

enum HttpResponseCode {
    Success = 200,
    NoContent = 204,
    Error = 400,
    TooManyRequests = 429,
}

export class RestClient {
    private apiVersion?: number;
    private applicationId?: string;
    private baseUrl: string;
    private token?: string;

    private isProxied: boolean;
    private routes: Routes;
    baseHeaders: Record<string, string>;

    constructor(options: RestClientOptions) {
        this.apiVersion = options.apiVersion ?? DISCORD_API_VERSION;
        this.applicationId = options.applicationId;
        this.baseUrl = options.baseUrl ?? DISCORD_API_URL;
        this.token = options.token;

        this.isProxied = !this.baseUrl.startsWith(DISCORD_API_URL);
        this.routes = createRoutes();

        this.baseHeaders = structuredClone({
            "user-agent": `DiscordBot (https://github.com/discordeno/Trinity, v${VERSION})`,
        });
    }

    private async runRequest(method: HttpMethod, route: string, options?: RunRequestOptions) {
        const url = `${this.baseUrl}/v${this.apiVersion}${route}`;
        const payload = this.createRequestBody(method, options);

        // if (this.isProxied) {
        //     const result = await fetch(url, payload);

        //     if (!result.ok) {
        //         const err = (await result.json().catch(() => {})) as Record<string, any>;
        //         // Legacy Handling to not break old code or when body is missing
        //         if (!err?.body) throw new Error(`Error: ${err.message ?? result.statusText}`);
        //         throw new Error(JSON.stringify(err));
        //     }

        //     return result.status !== 204 ? await result.json() : undefined;
        // }

        const result = await fetch(url, payload);
        if (!result.ok) {
            throw new Error(await result.text());
        }

        return result.status !== HttpResponseCode.NoContent ? camelize(await result.json()) : undefined;

        // const loggingHeaders = { ...payload.headers }

        // const authenticationScheme = payload.headers.authorization?.split(' ')[0]

        // if (payload.headers.authorization) {
        //   loggingHeaders.authorization = `${authenticationScheme} tokenhere`
        // }

        // logger.debug(`sending request to ${url}`, 'with payload:', { ...payload, headers: loggingHeaders })
        // const response = await fetch(url, payload).catch(async (error) => {
        //   logger.error(error)
        //   // Mark request and completed
        //   rest.invalidBucket.handleCompletedRequest(999, false)
        //   options.reject({
        //     ok: false,
        //     status: 999,
        //     error: 'Possible network or request shape issue occurred. If this is rare, its a network glitch. If it occurs a lot something is wrong.',
        //   })
        //   throw error
        // })
        // logger.debug(`request fetched from ${url} with status ${response.status} & ${response.statusText}`)

        // // Mark request and completed
        // rest.invalidBucket.handleCompletedRequest(response.status, response.headers.get(RATE_LIMIT_SCOPE_HEADER) === 'shared')

        // // Set the bucket id if it was available on the headers
        // const bucketId = rest.processHeaders(
        //   rest.simplifyUrl(options.route, options.method),
        //   response.headers,
        //   authenticationScheme === 'Bearer' ? payload.headers.authorization : '',
        // )
        // if (bucketId) options.bucketId = bucketId

        // if (response.status < HttpResponseCode.Success || response.status >= HttpResponseCode.Error) {
        //   logger.debug(`Request to ${url} failed.`)

        //   if (response.status !== HttpResponseCode.TooManyRequests) {
        //     options.reject({ ok: false, status: response.status, body: await response.text() })
        //     return
        //   }

        //   logger.debug(`Request to ${url} was ratelimited.`)
        //   // Too many attempts, get rid of request from queue.
        //   if (options.retryCount >= rest.maxRetryCount) {
        //     logger.debug(`Request to ${url} exceeded the maximum allowed retries.`, 'with payload:', payload)
        //     // rest.debug(`[REST - RetriesMaxed] ${JSON.stringify(options)}`)
        //     options.reject({
        //       ok: false,
        //       status: response.status,
        //       error: 'The request was rate limited and it maxed out the retries limit.',
        //     })

        //     return
        //   }

        //   options.retryCount += 1

        //   const resetAfter = response.headers.get(RATE_LIMIT_RESET_AFTER_HEADER)
        //   if (resetAfter) await delay(Number(resetAfter) * 1000)
        //   // process the response to prevent mem leak
        //   await response.arrayBuffer()

        //   return await options.retryRequest?.(options)
        // }

        // // Discord sometimes sends no response with no content.
        // options.resolve({ ok: true, status: response.status, body: response.status === HttpResponseCode.NoContent ? undefined : await response.text() })
    }

    private createRequestBody(method: HttpMethod, options?: RunRequestOptions): RequestInit {
        const headers = structuredClone(this.baseHeaders);

        if (options?.useAuthorizationToken !== false) headers.authorization = `Bot ${this.token}`;

        // If a reason is provided encode it in headers
        if (options?.reason !== undefined) {
            headers[AUDIT_LOG_REASON_HEADER] = encodeURIComponent(options?.reason);
        }

        let body: string | FormData | undefined;

        if (options?.files !== undefined) {
            const formData = new FormData();
            for (let i = 0; i < options.files.length; ++i) {
                formData.append(`file${i}`, options.files[i].blob, options.files[i].name);
            }

            if (options.body?.files) options.body.files = undefined;
            formData.append("payload_json", JSON.stringify(snakelize(options.body)));

            // No need to set the `content-type` header since `fetch` does that automatically for us when we use a `FormData` object.
            body = formData;
        } else if (options?.body && options.formUrlEncode) {
            headers["content-type"] = "application/x-www-form-urlencoded";

            const formBody: string[] = [];
            const discordBody = snakelize<Record<string, string | number | boolean>>(options.body);
            for (const prop in discordBody) {
                formBody.push(`${encodeURIComponent(prop)}=${encodeURIComponent(discordBody[prop])}`);
            }

            body = formBody.join("&");
        } else if (options?.body !== undefined) {
            // Sometimes special formatted form data needs to be send
            if (options.body instanceof FormData) {
                // No need to set the `content-type` header since `fetch` does that automatically for us when we use a `FormData` object.
                body = options.body;
            } else {
                headers["content-type"] = `application/json`;
                body = JSON.stringify(snakelize(options.body));
            }
        }

        // Sometimes special headers (e.g. custom authorization) need to be used
        if (options?.headers) {
            Object.assign(headers, options.headers);
        }

        return {
            body,
            headers,
            method,
        };
    }

    private async delete(route: string, options?: RunRequestOptions) {
        return this.runRequest(HttpMethod.Delete, route, options);
    }

    private async get(route: string, options?: RunRequestOptions) {
        return this.runRequest(HttpMethod.Get, route, options);
    }

    private async patch(route: string, options?: RunRequestOptions) {
        return this.runRequest(HttpMethod.Patch, route, options);
    }

    private async post(route: string, options?: RunRequestOptions) {
        return this.runRequest(HttpMethod.Post, route, options);
    }

    private async put(route: string, options?: RunRequestOptions) {
        return this.runRequest(HttpMethod.Put, route, options);
    }

    async getCurrentUser() {
        return this.get(this.routes.users.me);
    }

    // TODO: add embeds, compoentns to require
    async createMessage(channelId: string, options: RequireOne<CreateMessage, "content" | "stickerIds" | "files">) {
        return this.post(this.routes.channels.createMessage(channelId), { body: options, files: options.files });
    }
}

export type RestClientOptions = {
    apiVersion?: number;
    applicationId?: string;
    baseUrl?: string;
    token?: string;
};

type RunRequestOptions = {
    files?: FileContent[];
    formUrlEncode?: boolean;
    headers?: Record<string, string>;
    body?: any;
    reason?: string;
    useAuthorizationToken?: boolean;
};

// const client = new RestClient({ token: Bun.env.DISCORD_TOKEN });
// // const res = await client.getCurrentUser();
// const res = await client.createMessage("1101504929820069958", { content: "Hello World!" });
// console.log(res);

type RequireOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
    {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];
