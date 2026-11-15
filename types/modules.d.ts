declare module "mammoth/mammoth.browser" {
  const mammoth: {
    convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>;
  };
  export default mammoth;
}

declare module "imagetracerjs" {
  const ImageTracer: { imagedataToSVG(img: ImageData, options?: Record<string, unknown>): string };
  export default ImageTracer;
}
