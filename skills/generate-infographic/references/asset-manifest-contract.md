# Asset Manifest Contract

Canonical file: `manifest.yaml`

Canonical format:

- human-readable YAML

Canonical purpose:

- operational traceability for the generated asset bundle

Required fields:

- `asset_title`
- `asset_slug`
- `source_text_origin`
- `tenant_folder`
- `approved_infographic_brief_summary`
- `output_paths`
- `render_method`
- `qa_result`
- `png_qa_passed`
- `pdf_back_verification_passed`
- `linkedin_mobile_checks_passed`
- `assumptions`

Manifest intent:

- let each final asset folder carry its own production context
- record what source was used, which tenant folder was used, how the asset was rendered, and what QA outcome was reached
- record whether the accepted PNG, PDF-back verification, and LinkedIn mobile checks actually passed
