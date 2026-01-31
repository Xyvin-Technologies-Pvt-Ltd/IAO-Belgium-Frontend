import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, List } from 'lucide-react';
import { Button } from './button';
import { cn } from "@/lib/utils";

const RichTextEditor = ({ value, onChange, placeholder, className = "" }) => {
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
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'min-h-[80px] outline-none text-base md:text-sm prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
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
          onClick={toggleBulletList}
          className={`h-7 w-7 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        >
          <List size={14} />
        </Button>
      </div>

      {/* Editor */}
      <div className="px-3 py-2 relative">
        <EditorContent 
          editor={editor} 
          className="tiptap-editor"
        />
        {editor.isEmpty && (
          <div className="absolute top-2 left-3 text-muted-foreground pointer-events-none text-base md:text-sm">
            {placeholder}
          </div>
        )}
      </div>

      <style jsx>{`
        .tiptap-editor .ProseMirror {
          outline: none;
        }
        .tiptap-editor .ProseMirror p {
          margin: 0.25rem 0;
        }
        .tiptap-editor .ProseMirror ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .tiptap-editor .ProseMirror li {
          margin: 0.125rem 0;
        }
        .tiptap-editor .ProseMirror strong {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;