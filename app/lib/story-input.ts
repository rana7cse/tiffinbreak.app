export const TITLE_MAX = 120;
export const BODY_MAX = 10000;

export type StoryInputError =
  | "titleRequired"
  | "titleTooLong"
  | "bodyRequired"
  | "bodyTooLong";

/** Trims the title (collapsing whitespace) and the body (LF line ends). */
export function cleanStoryInput(title: string, body: string) {
  return {
    title: title.normalize("NFC").replace(/\s+/g, " ").trim(),
    body: body.normalize("NFC").replace(/\r\n?/g, "\n").trim(),
  };
}

/** Field errors for cleaned input; an empty object means it is valid. */
export function validateStoryInput(input: {
  title: string;
  body: string;
}): Partial<Record<"title" | "body", StoryInputError>> {
  const errors: Partial<Record<"title" | "body", StoryInputError>> = {};
  if (!input.title) errors.title = "titleRequired";
  else if (input.title.length > TITLE_MAX) errors.title = "titleTooLong";
  if (!input.body) errors.body = "bodyRequired";
  else if (input.body.length > BODY_MAX) errors.body = "bodyTooLong";
  return errors;
}
