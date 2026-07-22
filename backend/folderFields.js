const FOLDER_NAME_MAX_LENGTH = 255;

const FOLDER_SELECT_COLUMNS = 'folder_id, name, parent_id, user_id';

function parseFolderName(value) {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed) {
        return { error: 'Folder name is required' };
    }

    if (trimmed.length > FOLDER_NAME_MAX_LENGTH) {
        return { error: `Folder name must be ${FOLDER_NAME_MAX_LENGTH} characters or fewer` };
    }

    return { value: trimmed };
}

function parseParentId(value) {
    if (value === null || value === undefined || value === '') {
        return { value: null };
    }

    const parentId = Number(value);

    if (!Number.isInteger(parentId)) {
        return { error: 'Invalid parent folder id' };
    }

    return { value: parentId };
}

function parseFolderBody(body, { allowPartial = false } = {}) {
    const parsed = {};
    const errors = [];

    if (body?.name !== undefined) {
        const nameResult = parseFolderName(body.name);

        if (nameResult.error) {
            errors.push(nameResult.error);
        } else {
            parsed.name = nameResult.value;
        }
    }

    if (body?.parent_id !== undefined) {
        const parentResult = parseParentId(body.parent_id);

        if (parentResult.error) {
            errors.push(parentResult.error);
        } else {
            parsed.parent_id = parentResult.value;
        }
    }

    if (allowPartial && Object.keys(parsed).length === 0 && errors.length === 0) {
        errors.push('At least one field must be provided');
    }

    return { parsed, errors };
}

module.exports = {
    FOLDER_NAME_MAX_LENGTH,
    FOLDER_SELECT_COLUMNS,
    parseFolderName,
    parseParentId,
    parseFolderBody,
};
