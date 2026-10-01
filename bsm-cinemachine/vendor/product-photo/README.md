Product photo processing runs in the browser; source images are not sent to an external image service.

- ONNX Runtime Web 1.20.1: https://github.com/microsoft/onnxruntime/tree/v1.20.1 (MIT, see ONNX-LICENSE.txt).
- U²-Net small model (u2netp): https://github.com/xuebinqin/U-2-Net (Apache-2.0, see U2NET-LICENSE.txt).
- ONNX model distribution: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
- Model SHA-256: 309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8

Inference runs at 320 × 320 in a Web Worker, with one WASM thread for Safari compatibility. The alpha mask is resized to the image, the foreground is centered with 90 px margins on a transparent 1200 × 1200 PNG. Existing transparency is preserved. Complex backgrounds and fine transparent details may need the original-photo option; CMS users review the result before saving.
