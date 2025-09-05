---
name: ww-iframe
description: The ww-iframe component displays external web content within a specified area of a webpage by rendering an iframe, automatically determining whether the provided source is a URL or HTML code, and isolating it from the parent page's styles.
keywords: iframe, inline frame, external web content, html document, source property, http url, html source code, data:text/html uri scheme, isolation property, stacking context
---

#### ww-iframe

***Purpose:***
Renders an inline frame (iframe) to display external web content within a specific area of a web page.

***Features:***
- Renders as <iframe> element
- Shows placeholder in editing mode
- Auto-detects URL vs HTML source
- Isolates content using CSS isolation property

***Properties:***
- source: string - URL or HTML source code to display in the iframe. Default: ""
