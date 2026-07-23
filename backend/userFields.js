const USERNAME_MAX_LENGTH = 255;

const USER_SELECT_COLUMNS = 'user_id, username';

function parseUsername(value) {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed) {
        return { error: 'Username is required' };
    }

    if (trimmed.length > USERNAME_MAX_LENGTH) {
        return { error: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer` };
    }

    return { value: trimmed };
}

function parsePassword(value, { required = false } = {}) {
    if (value === undefined || value === null || value === '') {
        if (required) {
            return { error: 'Password is required' };
        }

        return { value: null };
    }

    if (typeof value !== 'string') {
        return { error: 'Password must be text' };
    }

    if (!value) {
        return { error: 'Password is required' };
    }

    return { value };
}

function parseAccountUpdateBody(body) {
    const parsed = {};
    const errors = [];

    if (body?.username !== undefined) {
        const usernameResult = parseUsername(body.username);

        if (usernameResult.error) {
            errors.push(usernameResult.error);
        } else {
            parsed.username = usernameResult.value;
        }
    }

    if (body?.password !== undefined) {
        const passwordResult = parsePassword(body.password, { required: true });

        if (passwordResult.error) {
            errors.push(passwordResult.error);
        } else {
            parsed.password = passwordResult.value;
        }
    }

    if (body?.current_password !== undefined) {
        const currentPasswordResult = parsePassword(body.current_password, { required: true });

        if (currentPasswordResult.error) {
            errors.push('Current password is required to change password');
        } else {
            parsed.current_password = currentPasswordResult.value;
        }
    }

    if (Object.keys(parsed).length === 0 && errors.length === 0) {
        errors.push('At least one field must be provided');
    }

    if (parsed.password !== undefined && parsed.current_password === undefined) {
        errors.push('Current password is required to change password');
    }

    return { parsed, errors };
}

module.exports = {
    USERNAME_MAX_LENGTH,
    USER_SELECT_COLUMNS,
    parseUsername,
    parsePassword,
    parseAccountUpdateBody,
};
