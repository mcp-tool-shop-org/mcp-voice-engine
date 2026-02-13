# Error Taxonomy - V1

All errors emitted by the Voice Engine must adhere to this structure.

## Structure
```typescript
interface VoiceError {
  code: string;       // Stable, machine-readable (e.g., "SYNTH_fail_provider")
  message: string;    // Human-readable
  traceId: string;    // Correlation ID
  details?: unknown;  // Safe context
}
```

## Error Codes
Codes are namespaced by layer.

### Core (1xxx)
- `CORE_plan_invalid`: Plan failed schema validation.
- `CORE_policy_violation`: Request violated a configured policy.

### Synthesis (2xxx)
- `SYNTH_provider_error`: Upstream provider failed.
- `SYNTH_unsupported_voice`: Voice ID not found in roster.
- `SYNTH_timeout`: Generation took too long.

### DSP (3xxx)
- `DSP_buffer_mismatch`: Samplerates or channels incompatible.
- `DSP_module_crash`: Internal math error.

### I/O & Adapters (4xxx)
- `IO_write_failed`: Could not write artifact.
- `IO_path_unsafe`: Path traversal attempt.
