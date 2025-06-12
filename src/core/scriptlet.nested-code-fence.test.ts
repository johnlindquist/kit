import ava from "ava";
import { parseMarkdownAsScriptlets } from "./scriptlets";

// Outer ~~~, inner ``` -------------------------------------------------------
ava("parseMarkdownAsScriptlets – nested ``` inside ~~~", async t => {
  const markdown = `
## [Code Review] jest.mocked

<!--
Snippet: crjestmock
-->

~~~paste
Instead of

\`\`\`ts
❌
const mockedSomething = something as jest.Mock<ReturnType<typeof something>>;
\`\`\`

consider:

\`\`\`ts
✅
const somethingMock = jest.mocked(something);
\`\`\`
~~~
`.trim();

  const scripts = await parseMarkdownAsScriptlets(markdown);
  t.is(scripts.length, 1);
  t.is(scripts[0].tool, "paste");
  t.true(
    scripts[0].scriptlet.includes(
      "const somethingMock = jest.mocked(something);"
    )
  );
  t.true(scripts[0].scriptlet.includes("❌"));
  t.true(scripts[0].scriptlet.includes("✅"));
});

// Outer ```, inner ~~~ --------------------------------------------------------
ava("parseMarkdownAsScriptlets – nested ~~~ inside ```", async t => {
  const markdown = `
## Dual fence demo
\`\`\`bash
echo "before"
~~~ts
console.log("inside");
~~~
echo "after"
\`\`\`
`.trim();

  const scripts = await parseMarkdownAsScriptlets(markdown);
  t.is(scripts.length, 1);
  t.is(scripts[0].tool, "bash");
  t.regex(scripts[0].scriptlet, /echo "before"/);
  t.regex(scripts[0].scriptlet, /console\.log\("inside"\);/);
  t.regex(scripts[0].scriptlet, /echo "after"/);
});