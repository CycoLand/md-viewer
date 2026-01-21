# Markdown Rendering Test Suite

This document is designed to exercise a wide range of common Markdown features (CommonMark/GFM). Each section includes examples meant to verify rendering correctness.

---

## 1. Headings

# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

Paragraph after headings to ensure spacing.

---

## 2. Paragraphs, Line Breaks, and Horizontal Rules

This is a paragraph with multiple lines.
Line breaks without two spaces should wrap in the same paragraph.

This is a new paragraph.

Hard line break with two spaces at the end of the line.  
This line should be on a new line because of the hard break.

Horizontal rules:

---
***
___

---

## 3. Emphasis

- Italic with asterisks: *italic*
- Italic with underscores: _italic_
- Bold with asterisks: **bold**
- Bold with underscores: __bold__
- Bold + italic: ***bold italic*** or ___bold italic___
- Strikethrough (GFM): ~~strikethrough~~
- Code (inline): `inline code`
- Combined: **bold _italic_ and `code` ~~strike~~**

---

## 4. Quotes (Blockquotes)

> This is a blockquote.
> It can span multiple lines.
>
> - It can contain lists
> - And even **formatting**
>
> > Nested blockquote level 2
> >
> > 1. With ordered lists
> > 2. And inline `code`

---

## 5. Lists

### Unordered

- Item A
- Item B
  - Subitem B1
    - Subitem B1a
  - Subitem B2
- Item C
  - Paragraph under list item (requires blank line):

    This is a paragraph that belongs to Item C.
    It should be indented to align with the bullet content.

### Ordered

1. First
2. Second
3. Third
   1. Sub-first
   2. Sub-second
4. Fourth (numbering should auto-correct even if numbers are the same)
1. Fifth (written as 1. in source)

### Ordered list starting from a custom number

7. Starts at seven
8. Eight
9. Nine

### Task list (GFM)

- [ ] Task not done
- [x] Task done
- [ ] Task with nested items
  - [x] Subtask done
  - [ ] Subtask not done

---

## 6. Links and URLs

Inline link: [OpenAI](https://openai.com)

Link with title: [MDN](https://developer.mozilla.org "MDN Web Docs")

Reference-style link: [CommonMark][commonmark]

Bare URL (autolink): https://example.com

Email autolink: <test@example.com>

Relative link: [Go to script.js](./script.js)

[commonmark]: https://commonmark.org

---

## 7. Images

Inline image:

![Alt text describing image](https://via.placeholder.com/150 "Placeholder image")

Reference-style image:

![Ref alt][img-ref]

[img-ref]: https://via.placeholder.com/100x60 "Ref placeholder"

Image wrapped in a link:

[![Logo alt](https://via.placeholder.com/80)](https://example.com)

---

## 8. Code

Inline code: `const x = 1;`

Indented code block (4 spaces):

    function hello() {
        console.log("Hello, world!");
    }

Fenced code block:

```
No language specified.
Supports symbols like < > & and should not be HTML-parsed.
```

Fenced code with language:

```js
// JavaScript example
const greet = (name) => {
  console.log(`Hello, ${name}!`);
};

greet("Markdown");
```

```json
{
  "name": "test",
  "valid": true
}
```

```python
# Python example
for i in range(3):
    print(i)
```

---

## 9. Tables (GFM)

| Feature    | Supported | Notes                        |
|------------|-----------|------------------------------|
| Alignment  | Yes       | Use colons for alignment     |
| HTML       | Partial   | Depends on renderer          |
| Emoji      | Optional  | Renderer dependent           |

Alignment examples:

| Left | Center | Right |
|:-----|:------:|------:|
| a    |   b    |     c |
| text | middle |  end  |

---

## 10. Escapes and Special Characters

Escaped characters: \* \_ \` \[ \] \( \) \# \+ \- \! \> \| \\

Literal backslash: \\

HTML entity: &amp; &lt; &gt; &quot; &apos;

Asterisks that should not format: \*not bold\*

---

## 11. Inline HTML (optional in Markdown)

<div style="border:1px solid #ccc; padding:8px;">
  <strong>Inline HTML block:</strong>
  <em>This may or may not be sanitized depending on your renderer.</em>
</div>

<p>Inline <span style="color: blue;">HTML</span> within a paragraph.</p>

---

## 12. Definitions (Definition Lists – may be renderer-dependent)

Term
: Definition for the term.

Another term
: First definition
: Second definition

---

## 13. Footnotes (GFM/extended markdown)

This sentence has a footnote.[^1] And another one here.[^note]

[^1]: This is the first footnote.
[^note]: This is the second footnote with more text.

---

## 14. Superscripts and Subscripts (renderer-dependent)

This is not standard CommonMark, but some renderers support:

- Superscript: X^2^ (may render literally)
- Subscript: H~2~O (may render literally)

---

## 15. Mentions, Emoji, and Checkboxes (GFM)

- Mention syntax: @user, @team/project
- Emoji shortcodes: :sparkles: :rocket: :tada: (renderer-dependent)
- Checkboxes (already covered under Task lists)

---

## 16. Headings with Links and IDs

### Heading with a [link](https://example.com)

Custom ID via HTML (renderer-dependent):

<h3 id="custom-id">Heading via HTML with custom id</h3>

Link to the custom heading: [Jump to custom h3](#custom-id)

---

## 17. Nested Elements and Edge Cases

- List item with a blockquote:
  - Item
    > Quote inside list item

- Blockquote containing a code block:

> Example:
>
> ```
> code inside a blockquote
> ```

- Code block containing backticks:

````
```
Nested fenced code block test
```
````

- Text with underscores_andCamelCase that should not italicize.
- URL with parentheses: https://en.wikipedia.org/wiki/Function_(mathematics)

---

## 18. Images with alt text edge cases

![Asterisks * in alt](https://via.placeholder.com/60)
![Underscore _ in alt](https://via.placeholder.com/60)

---

## 19. Summary

This file should help verify:

- Correct heading hierarchy
- Paragraph and line break behavior
- Emphasis rules
- Blockquotes and nesting
- Unordered/ordered/task lists and nesting
- Code blocks (inline, indented, fenced, language highlighting)
- Links (inline, reference, autolinks, titles, relative)
- Images (inline, reference, linked images)
- Tables with alignment
- Escapes and special characters
- Inline HTML handling
- Definition lists and footnotes (if supported)
- Edge cases (nested elements, tricky characters)

End of test.