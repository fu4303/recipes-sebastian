const markdown = require("remark-parse");

function parseRecipe(text) {
  const parser = new markdown.Parser(null, text);

  const recipe = {
    name: "",
    steps: [],
    tags: [],
    source: null
  };

  parser.parse().children.forEach(node => {
    if (node.type === "heading") {
      recipe.name = extractText(node);

      return;
    }

    if (node.type === "list") {
      recipe.steps.push({
        type: "ingredients",
        value: extractIngredients(node)
      });

      return;
    }

    const text = extractText(node);

    if (text.startsWith("Source:")) {
      recipe.source = text.substr("Source: ".length);

      return;
    }

    if (text.startsWith("#")) {
      text
        .split(" ")
        .map(tag => tag.substr(1))
        .forEach(tag => {
          recipe.tags.push(tag);
        });

      return;
    }

    recipe.steps.push({
      type: "text",
      value: text
    });
  });

  recipe.searchString = `${recipe.name}_${recipe.tags.join("")}`
    .replace(/\s/g, "")
    .toLowerCase();

  return recipe;
}

function extractText(node) {
  if (!node.children) {
    return node.value || "";
  }

  return node.children.reduce((text, child) => {
    return `${text} ${extractText(child)}`.trim();
  }, "");
}

function extractIngredients(node) {
  return node.children.map(extractText).map(parseIngredient);
}

function parseIngredient(ingredient) {
  // prettier-ignore
  const units = [
    "ball", "balls", "cloves", "cup", "g", "gram", "grams", "l", "ml", "oz",
    "tbsp", "tsp"
  ];

  const parts = ingredient.split(
    new RegExp(`^([0-9.,-/+\\s]+(${units.join("|")})?)(\\s+)`)
  );

  return parts.length === 1
    ? { amount: null, name: parts[0] }
    : { amount: parts[1], name: parts[4] };
}

function recipeLoader(source) {
  return `export default ${JSON.stringify(parseRecipe(source))}`;
}

module.exports = recipeLoader;
