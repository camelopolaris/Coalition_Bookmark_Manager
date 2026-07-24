const SESSION_NAME_MAX_LENGTH = 255;

const SESSION_SELECT_COLUMNS = 'session_id, name, user_id';

function parseSessionName(value) {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed) {
        return { error: 'Session name is required' };
    }

    if (trimmed.length > SESSION_NAME_MAX_LENGTH) {
        return { error: `Session name must be ${SESSION_NAME_MAX_LENGTH} characters or fewer` };
    }

    return { value: trimmed };
}

function parseSessionBody(body, { allowPartial = false } = {}) {
    const parsed = {};
    const errors = [];

    if (body?.name !== undefined) {
        const nameResult = parseSessionName(body.name);

        if (nameResult.error) {
            errors.push(nameResult.error);
        } else {
            parsed.name = nameResult.value;
        }
    }

    if (allowPartial && Object.keys(parsed).length === 0 && errors.length === 0) {
        errors.push('At least one field must be provided');
    }

    return { parsed, errors };
}

function parseBookmarkId(value) {
    const bookmarkId = Number(value);

    if (!Number.isInteger(bookmarkId) || bookmarkId < 1) {
        return { error: 'Invalid bookmark id' };
    }

    return { value: bookmarkId };
}

function mapSessionRow(row) {
    let bookmarkIds = [];

    if (Array.isArray(row.bookmark_ids)) {
        bookmarkIds = row.bookmark_ids.map(Number).filter((id) => Number.isInteger(id));
    } else if (typeof row.bookmark_ids === 'string') {
        bookmarkIds = row.bookmark_ids
            .replace(/^\{|\}$/g, '')
            .split(',')
            .map((value) => Number(value.trim()))
            .filter((id) => Number.isInteger(id));
    }

    return {
        session_id: row.session_id,
        name: row.name,
        user_id: row.user_id,
        bookmark_ids: bookmarkIds,
    };
}

module.exports = {
    SESSION_NAME_MAX_LENGTH,
    SESSION_SELECT_COLUMNS,
    parseSessionName,
    parseSessionBody,
    parseBookmarkId,
    mapSessionRow,
};
