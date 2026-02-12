export const GLOBALS = {
    BASE_URL: ((): string => {
        let baseURL = import.meta.env.BASE_URL;

        if (!baseURL.startsWith("/")) {
            baseURL = "/" + baseURL;
        }

        if (baseURL.endsWith("/")) {
            baseURL = baseURL.slice(0, -1);
        }

        return baseURL;
    })(),
};
