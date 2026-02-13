export interface ArtifactRefV1 {
    id: string;
}

export interface ArtifactViewV1 {
    type: "path" | "base64";
    value: string;
    mediaType?: string;
}
