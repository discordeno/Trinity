import { HttpMethod } from "./types.ts";

export class Ratelimiter {
    constructor() {}

    private simplifyUrl(route: string, method: HttpMethod) {
        const parts = route.split("/");
        const secondLastPart = parts[parts.length - 2];

        if (secondLastPart === "channels" || secondLastPart === "guilds") {
            return route;
        }

        if (secondLastPart === "reactions" || parts[parts.length - 1] === "@me") {
            parts.splice(-2);
            parts.push("reactions");
        } else {
            parts.splice(-1);
            parts.push("x");
        }

        if (parts[parts.length - 3] === "reactions") {
            parts.splice(-2);
        }

        if (method === "DELETE" && secondLastPart === "messages") {
            return `D${parts.join("/")}`;
        }

        return parts.join("/");
    }
}
