import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType, keymap } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";

import { fetcher } from "./fetcher";

// StateEffect: A way to send "messages" to update state.
// We define one effect type for setting the suggestion text.
const setSuggestionEffect = StateEffect.define<string | null>();

// StateField: Holds our suggestion state in the editor.
// - create(): Returns the initial value when the editor loads.
// - update(): Called on every transaction (keystroke, etc.) to potentially update the value.
const suggestionState = StateField.define<string | null>({
    create() {
        return null; // Initial suggestion text (for testing)
    },
    update(value, transaction) {
        // Check each effect in this transaction.
        // If we find our setSuggestionEffect, return its new value.
        // Otherwise, keep the current value unchanged.
        for (let effect of transaction.effects) {
            if (effect.is(setSuggestionEffect)) {
                return effect.value;
            }
        }
        return value;
    },
});

// WidgetType: Creates custom DOM elements to display in the editor.
// toDOM() is called by Codemirror to create the actual HTML element.
class SuggestionWidget extends WidgetType {
    constructor(readonly text: string) {
        super();
    }

    toDOM() {
        const span = document.createElement("span");
        span.textContent = this.text;
        span.style.opacity = "0.4"; // Ghost text appearance
        span.style.pointerEvents = "none"; // Don't interfere with clicks
        return span;
    }
}

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 300;

let currentAbortController: AbortController | null = null;

const generatePayload = (view: EditorView, fileName: string) => {
    const code = view.state.doc.toString();
    if (!code || code.trim().length === 0) return null;

    const cursorPosition = view.state.selection.main.head;
    const currentLine = view.state.doc.lineAt(cursorPosition);
    const cursorInLine = cursorPosition - currentLine.from;

    const previousLines: string[] = [];
    const previousLinesToFetch = Math.min(5, currentLine.number - 1);
    for (let i = previousLinesToFetch; i >= 1; i--) {
        previousLines.push(view.state.doc.line(currentLine.number - i).text);
    }

    const nextLines: string[] = [];
    const totalLines = view.state.doc.lines;
    const nextLinesToFetch = Math.min(5, totalLines - currentLine.number);
    for (let i = 1; i <= nextLinesToFetch; i++) {
        nextLines.push(view.state.doc.line(currentLine.number + i).text);
    }

    return {
        code,
        currentLine: currentLine.text,
        fileName,
        lineNumber: currentLine.number,
        nextLines: nextLines.join("\n"),
        previousLines: previousLines.join("\n"),
        textBeforeCursor: currentLine.text.slice(0, cursorInLine),
        textAfterCursor: currentLine.text.slice(cursorInLine),
    }
}

const createDebouncePlugin = (fileName: string) => {
    return ViewPlugin.fromClass(
        class {
            constructor(view: EditorView) {
                this.triggerSuggestion(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.triggerSuggestion(update.view);
                }
            }

            triggerSuggestion(view: EditorView) {
                if (debounceTimer !== null) {
                    clearTimeout(debounceTimer);
                }

                if (currentAbortController) {
                    currentAbortController.abort();
                }

                isWaitingForSuggestion = true;

                debounceTimer = window.setTimeout(async () => {
                    const payload = generatePayload(view, fileName);
                    if (!payload) {
                        isWaitingForSuggestion = false;
                        view.dispatch({
                            effects: setSuggestionEffect.of(null),
                        });
                        return;
                    }
                    currentAbortController = new AbortController();
                    const suggestion = await fetcher(payload, currentAbortController.signal);

                    isWaitingForSuggestion = false;
                    
                    view.dispatch({
                        effects: setSuggestionEffect.of(suggestion),
                    });
                }, DEBOUNCE_DELAY);
            }

            destroy() {
                if (debounceTimer !== null) {
                    clearTimeout(debounceTimer);
                }

                if (currentAbortController !== null) {
                    currentAbortController.abort();
                }
            }
        },
    );
}

const renderPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.build(view);
        }

        update(update: ViewUpdate) {
            // Rebuild decorations if the suggestion state changed, document changed or cursor moved.
            // "some" returns true if the callback returns true for any iem.
            const suggestionChanged = update.transactions.some((transaction) =>
                transaction.effects.some((effect) =>
                    effect.is(setSuggestionEffect)
                )
            );

            const shouldRebuild = suggestionChanged || update.docChanged || update.selectionSet;

            if (shouldRebuild) {
                this.decorations = this.build(update.view);
            }
        }

        build(view: EditorView) {
            // Don't show old suggestion while waiting for new one
            if (isWaitingForSuggestion) {
                return Decoration.none;
            }

            // Get current suggestion from state
            const suggestion = view.state.field(suggestionState);

            if (!suggestion) {
                return Decoration.none;
            }

            // Create a widget docoration at the cursor position
            const cursor = view.state.selection.main.head;
            return Decoration.set([
                Decoration.widget({
                    widget: new SuggestionWidget(suggestion),
                    side: 1, // Render after cursor (side: 1), not before (side: -1)
                }).range(cursor),
            ]);
        }
    },
    {
        // Tell Codemirror to use our decorations
        decorations: (plugin) => plugin.decorations
    },
);

const acceptSuggestionKeymap = keymap.of([
    {
        key: "Tab",
        run: (view) => {
            const suggestion = view.state.field(suggestionState);
            if (!suggestion) return false; // Make Tab do its normal thing (indent) if no suggestion

            const cursor = view.state.selection.main.head;
            view.dispatch({
                // Insert the suggestion text at the cursor position
                changes: {
                    from: cursor,
                    insert: suggestion,
                },
                // Move the cursor to the end of the inserted suggestion
                selection: {
                    anchor: cursor + suggestion.length,
                },
                // Clear the suggestion after accepting it
                effects: setSuggestionEffect.of(null),
            });

            return true; // Indicate that we handled Tab, so don't indent
        },
    },
]);

export const suggestion = (fileName: string) => [
    suggestionState, // State storage
    createDebouncePlugin(fileName), // Triggers suggestions on typing
    renderPlugin, // Render ghost text
    acceptSuggestionKeymap, // Handle accepting suggestions with Tab
];
