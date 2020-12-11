export let tutorial =
  (await env["SIMPLE_TEMPLATE"]) == "tutorial"

export let name = tutorial
  ? await arg(
      "Welcome! Enter a name for your first script:",
      {
        type: "suggest",
        name: "name",
        suggestions: [
          "my-first-script",
          "party-time",
          "demo-time",
          "woo-hoo",
        ],
      }
    )
  : ""
