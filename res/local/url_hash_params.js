function parseHashParams(url) {
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) {
        return {};
    }

    let hash = url.substring(hashIndex + 1);

    if (hash.startsWith('?')) {
        hash = hash.substring(1);
    }

    const params = {};

    hash.split('&').forEach(pair => {
        const [key, value = ''] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return params;
}

function buildQueryString(params) {
    return Object.keys(params)
        .map(key =>
            encodeURIComponent(key) + '=' +
            encodeURIComponent(params[key])
        )
        .join('&');
}

/*
 * alternative implementation:

function parseHashParams(url) {
    const hash = new URL(url).hash.replace(/^#\?/, '');
    return Object.fromEntries(new URLSearchParams(hash));
}
*/

