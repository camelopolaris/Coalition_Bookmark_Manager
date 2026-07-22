const BOOKMARK_NAME_MAX_LENGTH = 255;

const BOOKMARK_WRITABLE_FIELDS = ['name', 'url'];

const BOOKMARK_SELECT_COLUMNS = 'bookmark_id, name, url, folder_id, user_id';

function parseBookmarkFolderId(value) {
    if (value === null || value === undefined || value === '') {
        return { value: null };
    }

    const folderId = Number(value);

    if (!Number.isInteger(folderId)) {
        return { error: 'Invalid folder id' };
    }

    return { value: folderId };
}

function parseBookmarkField(field, value) {
    if (field === 'name') {
        const trimmed = typeof value === 'string' ? value.trim() : '';

        if (!trimmed) {
            return { error: 'Name is required' };
        }

        if (trimmed.length > BOOKMARK_NAME_MAX_LENGTH) {
            return { error: `Name must be ${BOOKMARK_NAME_MAX_LENGTH} characters or fewer` };
        }

        return { value: trimmed };
    }

    if (field === 'url') {
        const trimmed = typeof value === 'string' ? value.trim() : '';

        if (!trimmed) {
            return { error: 'URL is required' };
        }

        return { value: trimmed };
    }

    return null;
}

function parseBookmarkBody(body, { requireAll = false, allowPartial = false } = {}) {
    const parsed = {};
    const errors = [];

    for (const field of BOOKMARK_WRITABLE_FIELDS) {
        if (body?.[field] === undefined) {
            if (requireAll) {
                errors.push(`${field} is required`);
            }
            continue;
        }

        const result = parseBookmarkField(field, body[field]);

        if (!result) {
            continue;
        }

        if (result.error) {
            errors.push(result.error);
            continue;
        }

        parsed[field] = result.value;
    }

    if (!allowPartial && Object.keys(parsed).length !== BOOKMARK_WRITABLE_FIELDS.length) {
        errors.push('Name and URL are required');
    }

    if (allowPartial && Object.keys(parsed).length === 0 && errors.length === 0) {
        errors.push('At least one field must be provided');
    }

    return { parsed, errors };
}

module.exports = {
    BOOKMARK_NAME_MAX_LENGTH,
    BOOKMARK_WRITABLE_FIELDS,
    BOOKMARK_SELECT_COLUMNS,
    parseBookmarkBody,
    parseBookmarkFolderId,
};
