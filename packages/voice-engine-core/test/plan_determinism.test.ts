import { canonicalStringify } from "../src/canonical/index.js";
import { PresetRegistryV1 } from "../src/config/PresetRegistryV1.js";

// Construct specific input
const input = {
    text: "Hello World",
    preset: "pop"
};

const preset = PresetRegistryV1.resolvePreset(input.preset);

// Construct Plan matching RenderPlanV1
const plan = {
    planVersion: "voiceengine.plan.v1",
    traceId: "trace-mock-123",
    seed: 42,
    synth: [
        {
            id: "seg-1",
            req: {
                text: input.text,
                voiceId: "default-voice",
                speed: 1.05,
                format: "plain"
            }
        }
    ],
    post: [
        {
            kind: "autotune",
            intensity: preset.pitchCorrection,
            preset: "pop"
        }
    ],
    output: {
        mode: "base64",
        format: "wav"
    },
    modules: []
};

const output = canonicalStringify(plan);
const golden = `{"modules":[],"output":{"format":"wav","mode":"base64"},"planVersion":"voiceengine.plan.v1","post":[{"intensity":0.8,"kind":"autotune","preset":"pop"}],"seed":42,"synth":[{"id":"seg-1","req":{"format":"plain","speed":1.05,"text":"Hello World","voiceId":"default-voice"}}],"traceId":"trace-mock-123"}`;

if (output === golden) {
    console.log("Determinism check passed.");
    process.exit(0);
} else {
    console.error("Determinism check failed.");
    console.error("Expected:", golden);
    console.error("Actual:  ", output);
    process.exit(1);
}
