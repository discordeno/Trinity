export function camelize<T>(obj: any): T {
    if (obj === null || obj instanceof Blob || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.map((val) => camelize(val)) as T;
    }

    const acc = {} as T;
    for (let prop in obj) {
        acc[snakeToCamelCase(prop) as keyof T] = camelize(obj[prop]);
    }

    return acc;
}

export function snakelize<T>(obj: any): T {
    if (obj === null || obj instanceof Blob || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.map((val) => snakelize(val)) as T;
    }

    const acc = {} as T;
    for (let prop in obj) {
        acc[camelToSnakeCase(prop) as keyof T] = snakelize(obj[prop]);
    }

    return acc;
}

export function snakeToCamelCase(str: string): string {
    if (!str.includes("_")) return str;

    let result = "";
    for (let i = 0, len = str.length; i < len; ++i) {
        if (str[i] === "_") {
            result += str[++i].toUpperCase();

            continue;
        }

        result += str[i];
    }

    return result;
}

export function camelToSnakeCase(str: string): string {
    let result = "";
    for (let i = 0, len = str.length; i < len; ++i) {
        if (str[i] >= "A" && str[i] <= "Z") {
            result += `_${str[i].toLowerCase()}`;

            continue;
        }

        result += str[i];
    }

    return result;
}
