# Markdown Rendering Test Suite

This document exercises common Markdown features (CommonMark/GFM) with concise examples. The final section "Normal" provides a more realistic document sample.

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

## 2. Paragraphs and Rules

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

## 3. Emphasis and Inline Code

- Italic: *italic*
- Bold: **bold**
- Bold + italic: ***bold italic***
- Strikethrough: ~~strikethrough~~
- Inline code: `inline code`

---

## 4. Blockquotes

> This is a blockquote.
> It can span multiple lines.
>
> - It can contain lists
> - And even **formatting**
>
> > Nested blockquote level 2

---

## 5. Lists

### Unordered
- Item A
- Item B
  - Subitem B1
    - Subitem B1a
  - Subitem B2
- Item C

### Ordered
1. First
2. Second
3. Third
   1. Sub-first
   2. Sub-second

### Task list (GFM)
- [ ] Task not done
- [x] Task done

---

## 6. Links

Inline link: [OpenAI](https://openai.com)
Reference-style link: [CommonMark][commonmark]
Bare URL: https://example.com

[commonmark]: https://commonmark.org

---

## 7. Images

![Alt text describing image](https://via.placeholder.com/150 "Placeholder image")

---

## 8. Code

Inline code: `const x = 1;`

Fenced code with language:

```js
// JavaScript example
const greet = (name) => {
  console.log(`Hello, ${name}!`);
};

greet("Markdown");
```

---

## 9. Tables (GFM)

| Feature   | Supported | Notes                    |
|-----------|-----------|--------------------------|
| Alignment | Yes       | Use colons for alignment |

---

## 10. Escapes and Special Characters

Escaped characters: \* \_ \` \[ \] \( \) \# \+ \- \! \> \| \\
HTML entity: &amp; &lt; &gt; &quot; &apos;

---

## 11. Inline HTML (sanitized)

<div style="border:1px solid #ccc; padding:8px;">
  <strong>Inline HTML block:</strong>
  <em>This may be sanitized depending on your renderer.</em>
</div>

---

## Normal

A short, realistic sample with minimal formatting.

This viewer helps you read and organize notes, docs, and drafts comfortably. While Markdown lets you add structure, you don’t need much: a handful of headings, a few lists, and occasional emphasis can go a long way.

Here’s a simple list of ideas:
- Capture thoughts quickly
- Organize with headings
- Add links when needed

And a tiny code snippet:

```bash
# make a directory and move into it
mkdir notes && cd notes
```

Finally, a link for later: https://example.com

End of test.
