# Layout and Subject Safety

Choose the layout before generating the scene.

| Layout | Use when | Guardrail |
| --- | --- | --- |
| `top` | The scene needs a broad lower foreground. | Keep text outside the scene region. |
| `bottom` | The scene reads best across the upper area. | Do not force it when a bottom subject is critical. |
| `left` or `right` | The scene has natural horizontal negative space. | The information region must be deliberately empty. |
| `negative-space` | The existing or generated scene has true blank architecture, sky, wall, or floor. | Validate subject clearance and contrast at final size. |

Do not use a fixed deck-wide orientation. Select the least obstructive layout per slide.

Protect people, hands, workstations, gates, machines, output artifacts, paths, and decision points when they carry the slide's meaning. If a subject cannot survive the crop, edit or regenerate the foundation. Do not solve it by shrinking readable text or scaling the image until the subject disappears.

Declare scene and information regions as measurable compositor coordinates or percentages. A negative-space claim must describe what occupies the region and why it is safe. A low-contrast or blurred subject is not negative space.

Before flattening, inspect the foundation without annotations. Before integration, inspect the flattened result with annotations. An information panel must not conceal generated text, brand marks, diagram elements, or meaningful scene content.

At 920px compositor width: signal text >=24px, labels >=18px, descriptions >=20px. Increase the information region before reducing those floors.
