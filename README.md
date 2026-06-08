# n8n-nodes-google-vertex-ai

An [n8n](https://n8n.io) community node for **Google Vertex AI**. It brings Gemini text, multimodal analysis, image generation/editing (the "Nano Banana" Gemini image models), and Veo video generation into your n8n workflows.

> **Disclaimer:** This is an **unofficial, community-built** node and is **not affiliated with, endorsed by, or sponsored by Google**. "Google", "Vertex AI", "Gemini", and related marks are trademarks of Google LLC. You bring your own Google Cloud project and credentials, and your own API usage is billed by Google.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Usage notes](#usage-notes) · [Compatibility](#compatibility) · [Development](#development)

## Installation

### From the n8n editor (self-hosted)

1. Go to **Settings → Community Nodes → Install**.
2. Enter `n8n-nodes-google-vertex-ai` and confirm.
3. The **Google Vertex AI** node appears in the node panel.

### Manually

```bash
# in your n8n instance's user folder (e.g. ~/.n8n)
npm install n8n-nodes-google-vertex-ai
```

Then restart n8n.

## Credentials

Create a **Google Vertex AI API** credential. It uses a Google Cloud **service account**:

| Field | Description |
| --- | --- |
| **Region** | Vertex AI location (e.g. `us-central1`). Use a specific region for image/video; some Gemini models also support `global`. |
| **Project ID** | Your GCP project ID where the Vertex AI API is enabled. |
| **Service Account Email** | The service account's client email. |
| **Private Key** | The service account's private key (including the `BEGIN`/`END` lines). |

**Setup:** create a service account in your GCP project, grant it the **Vertex AI User** (`roles/aiplatform.user`) role, enable the **Vertex AI API**, and create a JSON key — copy `client_email`, `private_key`, and your `project_id` from it. See n8n's [Google service account guide](https://docs.n8n.io/integrations/builtin/credentials/google/service-account/). Use the credential's **Test** button to confirm authentication.

## Operations

**Text**
- **Message a Model** — send a prompt (with optional history) to a Gemini model and get a text reply.

**Image**
- **Analyze Image** — send one or more images + a question, get a text answer.
- **Generate an Image** — text → image (Nano Banana / Gemini image models). Returns the image as binary.
- **Edit Image** — upload one or more images + a prompt, get an edited image back as binary.

**Document**
- **Analyze Document** — send a document (PDF, etc.) and ask questions about it.

**Audio**
- **Analyze Audio** — ask questions about an audio file.
- **Transcribe Audio** — transcribe a recording to text.

**Video**
- **Analyze Video** — ask questions about a video.
- **Generate Video** — start a Veo text-to-video job; returns an operation name.
- **Get Video Status** — check whether a generation operation has finished.
- **Download Video** — download the finished video as binary.

Models are selectable per operation: Gemini (text/vision) for analyze/message, the Gemini image models (`gemini-2.5-flash-image`, `gemini-3-pro-image`, …) for image generate/edit, and Veo (`veo-3.1-generate-001`, …) for video.

## Usage notes

- **Image input** (Analyze / Edit) accepts one or more **binary** images via the **Images** field (add as many as you need). MIME type is auto-detected.
- **Image output** (Generate / Edit) is written to a binary field (default `edited`, configurable under **Options → Put Output In Field**).
- **Video is asynchronous.** Wire it as **Generate Video → (poll) Get Video Status until `done: true` → Download Video**. Generation takes from tens of seconds to a few minutes. Output is inline base64 → binary `video/mp4` (no Cloud Storage bucket required). Veo is region-specific — keep your credential region to a Veo-supported region such as `us-central1`.

## Compatibility

- Requires a recent n8n with community-node support.
- Tested against the Gemini, Imagen-family image, and Veo models available on Vertex AI as of mid-2026. Model IDs evolve — if a model returns a 404, pick another from the dropdown or update to a current ID.

## Development

```bash
npm install
npm run dev      # run n8n locally with this node + hot reload
npm test         # run the jest test suite
npm run lint     # n8n community-node lint
npm run build    # compile to dist/
```

Releases are published to npm via GitHub Actions with provenance (see `.github/workflows/publish.yml`); run `npm run release` to cut a version.

## License

[MIT](LICENSE)
