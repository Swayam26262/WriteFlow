"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './ui/button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4 leading-relaxed',
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Generate clean HTML with proper spacing
      let html = editor.getHTML()
      
      // Ensure proper spacing between elements
      html = html
        .replace(/<h[1-6][^>]*>/g, (match) => {
          // Add margin-top to headings (except first one)
          return match.replace('>', ' class="mt-8 mb-4">')
        })
        .replace(/<h1[^>]*>/g, (match) => {
          return match.replace('>', ' class="text-3xl font-bold mt-8 mb-4">')
        })
        .replace(/<h2[^>]*>/g, (match) => {
          return match.replace('>', ' class="text-2xl font-semibold mt-8 mb-4">')
        })
        .replace(/<h3[^>]*>/g, (match) => {
          return match.replace('>', ' class="text-xl font-semibold mt-6 mb-3">')
        })
        .replace(/<p[^>]*>/g, (match) => {
          return match.replace('>', ' class="mb-4 leading-relaxed">')
        })
        .replace(/<ul[^>]*>/g, (match) => {
          return match.replace('>', ' class="mb-4 ml-6 space-y-2">')
        })
        .replace(/<ol[^>]*>/g, (match) => {
          return match.replace('>', ' class="mb-4 ml-6 space-y-2">')
        })
        .replace(/<li[^>]*>/g, (match) => {
          return match.replace('>', ' class="leading-relaxed">')
        })
        .replace(/<blockquote[^>]*>/g, (match) => {
          return match.replace('>', ' class="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-700 bg-gray-50 rounded-r">')
        })
        .replace(/<code[^>]*>/g, (match) => {
          return match.replace('>', ' class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">')
        })
        .replace(/<pre[^>]*>/g, (match) => {
          return match.replace('>', ' class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">')
        })
      
      onChange(html)
    },
    autofocus: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-[50vh] p-4 focus:outline-none text-gray-900 leading-relaxed',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className={`border rounded-lg bg-white shadow-sm ${className || ''}`}>
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 px-2 text-xs"
        >
          H1
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 px-2 text-xs"
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-8 px-2 text-xs"
        >
          H3
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <EditorContent editor={editor} className="p-4" />
    </div>
  )
}
