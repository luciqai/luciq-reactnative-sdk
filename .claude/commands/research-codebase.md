---
description: Research and document how specific parts of the codebase work
---

# Research Codebase

Research a specific topic in the Luciq React Native SDK codebase and document findings.

## Parameters

- `topic` (required): What to research (e.g., "how network interception works", "crash reporting flow")

## Steps

1. **Decompose the question** into searchable sub-topics

2. **Search the codebase** using multiple strategies:
   - Grep for relevant class names, method names, and keywords
   - Glob for relevant file patterns
   - Read key files to understand implementation

3. **Trace the flow** from public API to native bridge:
   - Start from the public module in `src/modules/`
   - Follow through to native interface in `src/native/`
   - Check any utilities involved from `src/utils/`
   - Note the iOS (`ios/`) and Android (`android/`) native implementations

4. **Document findings** with:
   - Overview of the feature/system
   - Entry points (file:line references)
   - Core implementation details
   - Data flow (JS -> NativeModules -> Native)
   - Key patterns used
   - Test coverage locations

## Rules

- Document and explain the codebase as it exists - no improvements or suggestions
- All file paths must be relative to the repo root
- Include file:line references for key code locations
- Focus on accuracy over completeness
