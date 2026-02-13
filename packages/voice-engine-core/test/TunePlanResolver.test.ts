import { TunePlanResolver } from "../src/tuning/TunePlanResolver.js";
import { TuneRequestV1 } from "../src/schema/TuningV1.js";

console.log("Running TunePlanResolver Tests...");

const resolver = new TunePlanResolver();

// Test 1: Defaults (Natural, C Chromatic)
const req1: TuneRequestV1 = {
    mode: "scale",
    preset: "natural", 
    key: "C",
    scale: "chromatic"
};

const plan1 = resolver.resolve(req1);
if (plan1.parameters.snapStrengthQ !== 5000) throw new Error("Default snap failed");
if (plan1.scaleConfig.allowedPitchClasses.length !== 12) throw new Error("Chromatic length failed");
console.log("✅ Defaults Verified");

// Test 2: Robot Override
const req2: TuneRequestV1 = {
    mode: "scale",
    preset: "robot",
    key: "F#",
    scale: "major",
    overrides: { glideMs: 50 }
};

const plan2 = resolver.resolve(req2);
if (plan2.parameters.snapStrengthQ !== 10000) throw new Error("Robot snap failed");
if (plan2.parameters.glideMsQ !== 50) throw new Error("Glide override failed");
if (plan2.scaleConfig.key !== "F#") throw new Error("Key failed");
const fSharpMajor = [6, 8, 10, 11, 1, 3, 5].sort((a,b)=>a-b); // F# G# A# B C# D# E# -> 6 8 10 11 1 3 5
const match = JSON.stringify(plan2.scaleConfig.allowedPitchClasses) === JSON.stringify(fSharpMajor);
if (!match) throw new Error(`F# Major failed: ${JSON.stringify(plan2.scaleConfig.allowedPitchClasses)}`);

console.log("✅ Robot + Scale Logic Verified");

// Test 3: Determinism
const plan3a = resolver.resolve(req2);
plan3a.meta.timestamp = 0;
const plan3b = resolver.resolve(req2);
plan3b.meta.timestamp = 0;

if (JSON.stringify(plan3a) !== JSON.stringify(plan3b)) throw new Error("Determinism Violation");
console.log("✅ Determinism Verified");
