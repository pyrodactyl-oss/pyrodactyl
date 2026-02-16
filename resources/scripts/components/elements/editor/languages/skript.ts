import { LanguageDescription, LanguageSupport, StreamLanguage, type StreamParser } from '@codemirror/language';

type SkriptStreamState = {
    inString: '"' | "'" | null;
};

const skriptKeywords = new Set([
    'options',
    'import',
    'function',
    'command',
    'trigger',
    'on',
    'event',
    'if',
    'else',
    'while',
    'loop',
    'stop',
    'return',
    'exit',
    'set',
    'add',
    'remove',
    'delete',
    'clear',
    'send',
    'broadcast',
    'wait',
    'execute',
    'run',
]);

const skriptTypes = new Set([
    'player',
    'console',
    'number',
    'integer',
    'string',
    'text',
    'boolean',
    'location',
    'world',
    'item',
    'entity',
    'block',
]);

const skriptStreamParser: StreamParser<SkriptStreamState> = {
    name: 'skript',
    startState() {
        return { inString: null };
    },
    token(stream, state) {
        // Handle multi-token strings.
        if (state.inString !== null) {
            let escaped = false;
            while (!stream.eol()) {
                const ch = stream.next();
                if (ch === undefined) break;

                if (escaped) {
                    escaped = false;
                    continue;
                }

                if (ch === '\\') {
                    escaped = true;
                    continue;
                }

                if (ch === state.inString) {
                    state.inString = null;
                    break;
                }
            }
            return 'string';
        }

        // Whitespace
        if (stream.eatSpace()) return null;

        // Folding directives
        if (stream.sol() && stream.match(/#!(FOLD|UNFOLD)\b/i)) {
            stream.skipToEnd();
            return 'meta';
        }

        // Comments (# ...)
        if (stream.peek() === '#') {
            stream.skipToEnd();
            return 'comment';
        }

        // Variables: %some variable%
        if (stream.peek() === '%') {
            stream.next();
            while (!stream.eol()) {
                const ch = stream.next();
                if (ch === '%') break;
            }
            return 'variableName';
        }

        // Strings
        const quote = stream.peek();
        if (quote === '"' || quote === "'") {
            state.inString = quote;
            stream.next();
            return 'string';
        }

        // Numbers
        if (stream.match(/\d+(?:\.\d+)?/)) {
            return 'number';
        }

        // Operators / punctuation
        if (stream.match(/::|->|<=|>=|!=|==|\+|-|\*|\/|%|\^|\(|\)|\[|\]|\{|\}|:|,|\./)) {
            return 'operator';
        }

        // Words (Skript allows hyphens in identifiers)
        const word = stream.match(/[A-Za-z_][A-Za-z0-9_-]*/);
        if (word) {
            const lower = word[0].toLowerCase();
            if (skriptKeywords.has(lower)) return 'keyword';
            if (skriptTypes.has(lower)) return 'typeName';
            return 'variableName';
        }

        // Fallback: consume one char
        stream.next();
        return null;
    },
};

const skriptLanguage = StreamLanguage.define(skriptStreamParser);

export const skriptLanguageDescription = LanguageDescription.of({
    name: 'Skript',
    alias: ['skript', 'sk'],
    extensions: ['sk'],
    load: async () => new LanguageSupport(skriptLanguage),
});
