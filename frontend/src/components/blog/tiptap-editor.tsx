"use client";

import { useAuth } from "@/contexts/auth";
import { uploadImage } from "@/http/post";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { Markdown } from "tiptap-markdown";
import { PlaceholderPicker } from "./placeholder-picker";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const { getToken } = useAuth();
  const token = getToken();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing your article...",
      }),
      Color,
      TextStyle,
      // 👇 AJOUT DE L'EXTENSION ICI
      Markdown.configure({
        html: true, // Autorise le HTML à l'intérieur du Markdown
        transformPastedText: true, // Convertit automatiquement le Markdown collé
        transformCopiedText: true, // Copie le contenu en Markdown dans le presse-papier
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Note : Tu peux choisir de récupérer du HTML ou du Markdown ici.
      // Pour l'instant, on garde HTML pour ton backend actuel.
      onChange(editor.getHTML());
      // Si un jour tu veux sauvegarder en Markdown en BDD : onChange(editor.storage.markdown.getMarkdown())
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6",
          "prose-headings:font-bold prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4",
          "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-slate-700 prose-h2:pb-2",
          "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3",
          "prose-p:leading-8 prose-p:mb-6",
          "prose-a:text-stats-blue-600 dark:prose-a:text-stats-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline",
          "prose-strong:font-bold",
          "prose-img:rounded-xl prose-img:shadow-xl prose-img:border prose-img:border-gray-200 dark:prose-img:border-stats-blue-800",
          "prose-blockquote:border-l-stats-blue-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-slate-900/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic",
          "prose-ul:list-disc prose-ul:pl-6",
          "prose-ol:list-decimal prose-ol:pl-6",
          "prose-li:mb-2",
          "prose-code:bg-gray-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-gray-100 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-slate-700 prose-pre:rounded-lg",
        ].join(" "),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    // On ne met à jour le contenu que si l'éditeur n'a pas le focus
    // OU si le contenu est vide (initialisation)
    if (!editor.isFocused && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = useCallback(async () => {
    if (!editor || !token) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const { url } = await uploadImage(file, token);
          const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${url}`;
          editor.chain().focus().setImage({ src: fullUrl }).run();
        } catch (error) {
          console.error("Failed to upload image:", error);
          alert("Failed to upload image");
        }
      }
    };
    input.click();
  }, [editor, token]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertPlaceholder = useCallback(
    (placeholder: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(placeholder).run();
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 dark:border-stats-blue-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-300 dark:border-stats-blue-700 bg-gray-50 dark:bg-stats-blue-900 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("bold") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("italic") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("strike") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("code") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 dark:bg-stats-blue-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("heading", { level: 1 }) ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("heading", { level: 2 }) ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("heading", { level: 3 }) ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 dark:bg-stats-blue-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("bulletList") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("orderedList") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("blockquote") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 dark:bg-stats-blue-700 mx-1" />
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 ${
            editor.isActive("link") ? "bg-gray-300 dark:bg-stats-blue-700" : ""
          }`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800"
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <PlaceholderPicker onInsert={insertPlaceholder} />
        <div className="w-px bg-gray-300 dark:bg-stats-blue-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="bg-white dark:bg-stats-blue-950 min-h-[500px]" />
    </div>
  );
}
