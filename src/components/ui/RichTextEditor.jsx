import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from "@/lib/utils";

const RichTextEditor = ({ value, onChange, placeholder, className = "" }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'min-h-[80px] outline-none text-base md:text-sm focus:outline-none',
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if the content is actually different to avoid cursor jumping
      if (currentContent !== value) {
        editor.commands.setContent(value || '');
      }
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  const setLink = useCallback(() => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    // Add https:// if no protocol is specified
    const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      // Apply link to selected text
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      // No selection — insert the URL as linked text
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    }

    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const openLinkInput = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkInput(true);
  };

  return (
    <div className={cn(
      "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-16 w-full min-w-0 rounded-[6px] border-[0.5px] transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      "bg-white",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-input bg-gray-50/50 dark:bg-gray-800/50 rounded-t-[6px]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          className={`h-7 w-7 p-0 ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        >
          <Bold size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleItalic}
          className={`h-7 w-7 p-0 ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        >
          <Italic size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBulletList}
          className={`h-7 w-7 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        >
          <List size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleOrderedList}
          className={`h-7 w-7 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        >
          <ListOrdered size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openLinkInput}
          className={`h-7 w-7 p-0 ${editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        >
          <LinkIcon size={14} />
        </Button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-input bg-gray-50/50 dark:bg-gray-800/50">
          <input
            type="text"
            placeholder="Enter URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setLink();
              } else if (e.key === 'Escape') {
                setShowLinkInput(false);
                setLinkUrl('');
              }
            }}
            className="flex-1 px-2 py-1 text-sm border border-input rounded bg-white dark:bg-gray-900 outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={setLink}
            className="h-7 px-3 text-xs"
          >
            Set
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="h-7 px-3 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="px-3 py-2 relative">
        <EditorContent 
          editor={editor} 
          className="tiptap-editor"
        />
      </div>

      <style jsx>{`
        .tiptap-editor .ProseMirror {
          outline: none;
          line-height: 1.5;
          min-height: 80px;
        }
        .tiptap-editor .ProseMirror p {
          margin: 0.25rem 0;
        }
        .tiptap-editor .ProseMirror p:first-child {
          margin-top: 0;
        }
        .tiptap-editor .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .tiptap-editor .ProseMirror ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style-type: disc;
        }
        .tiptap-editor .ProseMirror ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style-type: decimal;
        }
        .tiptap-editor .ProseMirror li {
          margin: 0.125rem 0;
          display: list-item;
        }
        .tiptap-editor .ProseMirror li p {
          margin: 0;
          display: inline;
        }
        .tiptap-editor .ProseMirror strong {
          font-weight: bold;
        }
        .tiptap-editor .ProseMirror em {
          font-style: italic;
        }
        .tiptap-editor .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-editor .ProseMirror a:hover {
          text-decoration: none;
        }
        .tiptap-editor .ProseMirror ul ul,
        .tiptap-editor .ProseMirror ol ol,
        .tiptap-editor .ProseMirror ul ol,
        .tiptap-editor .ProseMirror ol ul {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;