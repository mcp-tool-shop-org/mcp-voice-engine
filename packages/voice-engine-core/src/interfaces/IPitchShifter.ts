import { IModule } from "./IModule";
import { AudioBufferV1, F0TrackV1, VoicingMaskV1, TargetCurveV1, CorrectionEnvelopeV1 } from "../index";

export interface IPitchShifter extends IModule {
    shift(
        audio: AudioBufferV1,
        f0Track: F0TrackV1,
        voicing: VoicingMaskV1,
        target: TargetCurveV1,
        envelope: CorrectionEnvelopeV1
    ): Promise<AudioBufferV1>;
}
