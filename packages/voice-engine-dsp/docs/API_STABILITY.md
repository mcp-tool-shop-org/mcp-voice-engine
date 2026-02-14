# API Stability & Versioning

## Semantic Versioning
This package follows [Semantic Versioning 2.0.0](https://semver.org/).

- **Major (X.y.z)**: Incompatible API changes.
- **Minor (x.Y.z)**: Backwards-compatible functionality (new features).
- **Patch (x.y.Z)**: Backwards-compatible bug fixes.

The `PROSODY_API_VERSION` constant exported from the package indicates the current version.

## Snapshot & Restore
The `StreamingAutotuneEngine` provides a mechanism to save and restore its state.

### Snapshot Format
The snapshot object returned by `snapshot()` has the following structure:

```json
{
  "version": "1.0.0", // string, matching PROSODY_API_VERSION
  "state": { ... }    // Internal runtime state (ProsodyRuntimeStateV1)
}
```

### Compatibility
The `restore(snapshot)` method checks the `version` field.
- Takes a snapshot object.
- Validates that the Major version of the snapshot matches the current `PROSODY_API_VERSION` Major version.
- If versions are incompatible or the format is invalid, an Error is thrown.
