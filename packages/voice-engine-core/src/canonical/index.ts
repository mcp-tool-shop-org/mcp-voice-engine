export function canonicalStringify(value: unknown): string {
    return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'number') {
        // Quantize to 4 decimal places to avoid floating point jitter in plans
        if (Number.isInteger(value)) {
            return value;
        }
        return Math.round(value * 10000) / 10000;
    }

    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    // Handle TypedArrays (like Float32Array) by converting to regular arrays
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        return Array.from(value as any).map(canonicalize);
    }

    if (typeof value === 'object') {
        // Sort keys and recurse
        const sortedObj: Record<string, unknown> = {};
        const keys = Object.keys(value as object).sort();
        
        for (const key of keys) {
            const val = (value as Record<string, unknown>)[key];
            // Omit undefined values
            if (val !== undefined) {
                sortedObj[key] = canonicalize(val);
            }
        }
        return sortedObj;
    }

    return value;
}
