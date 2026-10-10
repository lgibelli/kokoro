import { describe, test, expect } from "vitest";
import { KokoroTTS, TextSplitterStream, phonemize } from "../src/kokoro.js";

// The model is left out: generate_from_ids is stubbed to return the phonemes the tokenizer was given.
const stub = (options) => {
  const tts = new KokoroTTS(null, (phonemes) => ({ input_ids: phonemes }), options);
  tts.generate_from_ids = async (input_ids) => input_ids;
  return tts;
};

describe("Custom phonemizer", () => {
  test("generate() uses the phonemizer it was given, with the voice's language", async () => {
    const tts = stub({ phonemizer: async (text, language) => `${language}:${text}` });
    expect(await tts.generate("Hello there.", { voice: "bf_emma" })).toBe("b:Hello there.");
  });

  test("stream() uses it for every sentence", async () => {
    const tts = stub({ phonemizer: (text) => text.toUpperCase() });
    const splitter = new TextSplitterStream();
    splitter.push("One. Two.");
    splitter.close();
    const out = [];
    for await (const { text, phonemes } of tts.stream(splitter)) out.push([text, phonemes]);
    expect(out).toEqual([
      ["One.", "ONE."],
      ["Two.", "TWO."],
    ]);
  });

  test("espeak-ng is the default, and exported", async () => {
    const tts = stub();
    expect(await tts.generate("Hello", { voice: "af_heart" })).toBe(await phonemize("Hello", "a"));
  });
});
