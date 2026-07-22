const TIMESTAMP_SELECT_COLUMNS = 'bookmark_id, timestamp_value, note_content';
const PAGE_NUMBER_SELECT_COLUMNS = 'bookmark_id, page_number, note_content';

function formatInterval(interval) {
    if (typeof interval === 'string') {
        return interval;
    }

    if (!interval || typeof interval !== 'object') {
        return '00:00:00';
    }

    let totalSeconds = Math.floor(interval.seconds || 0);
    totalSeconds += (interval.minutes || 0) * 60;
    totalSeconds += (interval.hours || 0) * 3600;
    totalSeconds += (interval.days || 0) * 86400;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
    ].join(':');
}

function parseTimestampValue(value) {
    if (typeof value !== 'string') {
        return { error: 'Timestamp is required' };
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return { error: 'Timestamp is required' };
    }

    const partsMatch = trimmed.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);

    if (partsMatch) {
        const hasHours = partsMatch[3] !== undefined;
        const hours = hasHours ? Number(partsMatch[1]) : 0;
        const minutes = hasHours ? Number(partsMatch[2]) : Number(partsMatch[1]);
        const seconds = hasHours ? Number(partsMatch[3]) : Number(partsMatch[2]);

        if ([hours, minutes, seconds].some((part) => !Number.isInteger(part) || part < 0)) {
            return { error: 'Invalid timestamp format' };
        }

        if (minutes >= 60 || seconds >= 60) {
            return { error: 'Minutes and seconds must be less than 60' };
        }

        return {
            value: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        };
    }

    if (/^\d+$/.test(trimmed)) {
        const totalSeconds = Number(trimmed);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            value: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        };
    }

    return { error: 'Timestamp must use HH:MM:SS, MM:SS, or total seconds' };
}

function parseNoteContent(value) {
    if (value === null || value === undefined) {
        return { value: '' };
    }

    if (typeof value !== 'string') {
        return { error: 'Note must be text' };
    }

    return { value: value.trim() };
}

function parsePageNumber(value) {
    const pageNumber = Number(value);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return { error: 'Page number must be a positive integer' };
    }

    return { value: pageNumber };
}

function mapTimestampRow(row) {
    return {
        bookmark_id: row.bookmark_id,
        timestamp_value: formatInterval(row.timestamp_value),
        note_content: row.note_content ?? '',
    };
}

function mapPageNumberRow(row) {
    return {
        bookmark_id: row.bookmark_id,
        page_number: row.page_number,
        note_content: row.note_content ?? '',
    };
}

module.exports = {
    TIMESTAMP_SELECT_COLUMNS,
    PAGE_NUMBER_SELECT_COLUMNS,
    formatInterval,
    parseTimestampValue,
    parseNoteContent,
    parsePageNumber,
    mapTimestampRow,
    mapPageNumberRow,
};
