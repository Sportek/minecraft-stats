"use client";

import { useAuth } from "@/contexts/auth";
import { resolveAssetUrl } from "@/lib/domain";
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
  onChange: (markdown: string) => void;
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
          class: "text-accent underline",
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
      // On sauvegarde le contenu en Markdown. Le rendu public le reconvertit en
      // HTML via markdown-it (voir src/lib/markdown.ts).
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-lg dark:prose-invert max-w-none break-words focus:outline-hidden min-h-[500px] p-4 sm:p-6",
          "prose-headings:font-bold prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4",
          "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
          "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3",
          "prose-p:leading-8 prose-p:mb-6",
          "prose-a:text-accent prose-a:font-medium prose-a:no-underline hover:prose-a:underline",
          "prose-strong:font-bold",
          "prose-img:rounded-xl prose-img:shadow-xl prose-img:border prose-img:border-border",
          "prose-blockquote:border-l-accent prose-blockquote:bg-secondary prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic",
          "prose-ul:list-disc prose-ul:pl-6",
          "prose-ol:list-decimal prose-ol:pl-6",
          "prose-li:mb-2",
          "prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm prose-pre:leading-relaxed prose-pre:text-foreground prose-pre:overflow-x-auto",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:text-sm",
        ].join(" "),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    // On ne met à jour le contenu que si l'éditeur n'a pas le focus
    // OU si le contenu est vide (initialisation). On compare en Markdown car
    // c'est désormais le format échangé via la prop `content`.
    if (!editor.isFocused && content !== editor.storage.markdown.getMarkdown()) {
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
          editor.chain().focus().setImage({ src: resolveAssetUrl(url) }).run();
        } catch (error) {
          console.error("Failed to upload image:", error instanceof Error ? error.message : error);
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

  const toolbarButton =
    "rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50";
  const toolbarButtonActive = "bg-accent/10 text-accent hover:bg-accent/10 hover:text-accent";
  const toolbarSeparator = "mx-1 h-5 w-px self-center bg-border";

  return (
    <div className="bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`${toolbarButton} ${
            editor.isActive("bold") ? toolbarButtonActive : ""
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`${toolbarButton} ${
            editor.isActive("italic") ? toolbarButtonActive : ""
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`${toolbarButton} ${
            editor.isActive("strike") ? toolbarButtonActive : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`${toolbarButton} ${
            editor.isActive("code") ? toolbarButtonActive : ""
          }`}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <div className={toolbarSeparator} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${toolbarButton} ${
            editor.isActive("heading", { level: 1 }) ? toolbarButtonActive : ""
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${toolbarButton} ${
            editor.isActive("heading", { level: 2 }) ? toolbarButtonActive : ""
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${toolbarButton} ${
            editor.isActive("heading", { level: 3 }) ? toolbarButtonActive : ""
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className={toolbarSeparator} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${toolbarButton} ${
            editor.isActive("bulletList") ? toolbarButtonActive : ""
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${toolbarButton} ${
            editor.isActive("orderedList") ? toolbarButtonActive : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${toolbarButton} ${
            editor.isActive("blockquote") ? toolbarButtonActive : ""
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className={toolbarSeparator} />
        <button
          type="button"
          onClick={setLink}
          className={`${toolbarButton} ${
            editor.isActive("link") ? toolbarButtonActive : ""
          }`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className={toolbarButton}
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <PlaceholderPicker onInsert={insertPlaceholder} />
        <div className={toolbarSeparator} />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className={toolbarButton}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className={toolbarButton}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="min-h-[500px] overflow-x-auto bg-background" />
    </div>
  );
}
