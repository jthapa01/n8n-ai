/**
 * HANDLEBARS TEMPLATE UTILITIES
 *
 * Provides template processing with extended syntax support.
 * Allows bracket notation for accessing properties with spaces/special chars.
 *
 * Example:
 *   {{googleForm.responses['Question Name']}} → works!
 *   {{json someObject}} → outputs formatted JSON
 */

import Handlebars from "handlebars";

// Register json helper globally
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

/**
 * Preprocess template to convert bracket notation to Handlebars lookup
 * e.g., {{obj['key with spaces']}} → {{lookup obj "key with spaces"}}
 */
export const preprocessTemplate = (template: string): string => {
  // Match {{path['key']}} or {{path["key"]}} patterns
  return template.replace(
    /\{\{([^}]+)\[['"]([^'"]+)['"]\]\}\}/g,
    '{{lookup $1 "$2"}}',
  );
};

/**
 * Compile and execute a Handlebars template with preprocessing
 * Supports:
 *   - Standard Handlebars: {{variable}}, {{nested.property}}
 *   - Bracket notation: {{obj['key with spaces']}}
 *   - JSON helper: {{json someObject}}
 */
export const compileTemplate = (
  template: string,
  context: Record<string, unknown>,
): string => {
  const preprocessed = preprocessTemplate(template);
  return Handlebars.compile(preprocessed)(context);
};
