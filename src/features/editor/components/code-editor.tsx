import { useEffect, useMemo, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

import { customSetup } from "../extensions/custom-setup";
import { customTheme } from "../extensions/theme";
import { getLanguageExtension } from "../extensions/language-extension";
import { minimap } from "../extensions/minimap";
import { suggestion } from "../extensions/suggestion";
import { quickEdit } from "../extensions/quick-edit";
import { selectionTooltip } from "../extensions/selection-tooltip";

interface Props {
    fileName: string;
    initialValue?: string;
    onChange: (value: string) => void;
}

export const CodeEditor = ({ fileName, initialValue = "", onChange }: Props) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const languageExtension = useMemo(() => {
        return getLanguageExtension(fileName);
    }, [fileName]);

    useEffect(() => {
        if (!editorRef.current) return;

        const view = new EditorView({
            doc: initialValue,
            parent: editorRef.current,
            extensions: [
                customSetup,
                customTheme,
                indentationMarkers(),
                suggestion(fileName),
                quickEdit(),
                selectionTooltip(),
                keymap.of([indentWithTab]),
                languageExtension,
                minimap(),
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                })
            ],
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is only used for initial document
    }, [languageExtension]);

    return (
        <div ref={editorRef} className="size-full pl-4 bg-background" />
    );
}