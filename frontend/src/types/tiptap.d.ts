import "@tiptap/core";

// L'extension `tiptap-markdown` ajoute une entrée `markdown` au storage de
// l'éditeur sans fournir les types correspondants. On la déclare ici.
declare module "@tiptap/core" {
  interface Storage {
    markdown: {
      getMarkdown: () => string;
    };
  }
}
