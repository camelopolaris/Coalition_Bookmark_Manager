const { pipeline } = require('@xenova/transformers');

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMENSIONS = 384;

let embedderPromise = null;

function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = pipeline('feature-extraction', EMBEDDING_MODEL);
    }

    return embedderPromise;
}

async function embedText(text) {
    const trimmed = typeof text === 'string' ? text.trim() : '';

    if (!trimmed) {
        throw new Error('Text is required to generate an embedding');
    }

    const extractor = await getEmbedder();
    const output = await extractor(trimmed, { pooling: 'mean', normalize: true });

    return Array.from(output.data);
}

module.exports = {
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS,
    embedText,
};
