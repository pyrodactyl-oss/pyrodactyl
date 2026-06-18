const _CONVERSION_UNIT = 1024;
const _DECIMAL_UNIT = 1000;

function mbToBytes(megabytes: number): number {
    return Math.floor(megabytes * _CONVERSION_UNIT * _CONVERSION_UNIT);
}

function formatBytes(bytes: number, binary: boolean, decimals = 2): string {
    const k = binary ? _CONVERSION_UNIT : _DECIMAL_UNIT;
    const units = binary ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'] : ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    if (bytes < 1) return '0 Bytes';

    decimals = Math.floor(Math.max(0, decimals));
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = Number((bytes / Math.pow(k, i)).toFixed(decimals));

    return `${value} ${units[i]}`;
}

function bytesToString(bytes: number, decimals = 2): string {
    return formatBytes(bytes, true, decimals);
}

function ip(value: string): string {
    return /([a-f0-9:]+:+)+[a-f0-9]+/.test(value) ? `[${value}]` : value;
}

export { ip, mbToBytes, bytesToString, formatBytes };
