const readAttribute = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2] || "";
};

/**
 * CRO renders a second export-only form named xform after the WebForms form.
 * Postbacks must contain fields from aspnetForm only; including xform.inExp
 * makes CRO return an empty export instead of applying the selected filters.
 */
export const primaryCroFormHtml = (html: string) => {
  const forms = html.match(/<form\b[\s\S]*?<\/form>/gi) || [];
  const aspNetForm = forms.find((form) => {
    const openingTag = form.match(/^<form\b[^>]*>/i)?.[0] || "";
    return /^(?:aspnetForm)$/i.test(readAttribute(openingTag, "id"))
      || /^(?:aspnetForm)$/i.test(readAttribute(openingTag, "name"));
  });
  return aspNetForm || forms[0] || html;
};
