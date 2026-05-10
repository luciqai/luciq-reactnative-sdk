---
description: Transform internal release notes into public-facing release notes for React Native SDK consumers
---

# Create Public Release Notes

Transform internal release notes into public-facing release notes suitable for React Native SDK consumers.

## Parameters

- `releaseNotesUrl` (required): The URL containing the internal release notes
  - Example: `releaseNotesUrl=https://your-wiki.com/RN+19.3.0+Internal+Release+Notes`
  - The version number will be automatically extracted from the URL

## Step 1: Extract Version and Request Content

Extract the version number from the `releaseNotesUrl` parameter.

Prompt the user:

```
I'll help you transform the internal release notes from:
{releaseNotesUrl}

Since this page may require authentication, please follow these steps:

1. Open the URL in your browser: {releaseNotesUrl}
2. Copy ALL the release notes content from the page
3. Paste the content below

I'll transform it into professional, public-facing release notes for React Native SDK v{version}.

Please paste the content now:
```

Wait for the user to provide the internal notes content.

## Step 2: Analyze and Categorize

Review the internal notes and for each item:

1. Identify the type (Feature, Improvement, Bug Fix, Other)
2. Determine if public-facing (remove internal-only items)
3. Extract the core user-facing change
4. Remove all internal jargon and references

## Step 3: Transform Content

### Tone and Style

- Professional, concise, and clear - write for SDK consumers
- Use team perspective: "We've added...", "Fixed an issue where...", "Improved..."

### Remove

- Ticket IDs (MOB-XXXX)
- Developer names
- Internal tools references
- Debug logs mentions
- CI/CD references
- QA process details
- Feature flags

### Keep

- New features
- Improvements
- Public bug fixes
- SDK API changes
- Performance enhancements
- Compatibility updates

### Generalize

- "Fixed internal NativeModule marshaling" -> "Improved platform communication reliability"
- "Updated XhrNetworkInterceptor implementation" -> "Enhanced network request tracking accuracy"

### React Native-Specific Considerations

- Note platform-specific fixes (iOS/Android) when relevant
- Highlight TypeScript API changes clearly
- Mention React Navigation or Expo compatibility changes
- Note any changes to the CLI tool or source map upload process

## Step 4: Generate Output

Format as a flat list with category prefixes:

```markdown
### React Native SDK v{version} Release Notes

- **New Feature:** Added support for custom performance span tracking.
- **New Feature:** Introduced native network interception mode.
- **Improvement:** Enhanced session replay performance on Android.
- **Improvement:** Reduced SDK initialization time.
- **Bug Fix:** Fixed an issue where crash reports were not sent when app was backgrounded.
- **Bug Fix:** Fixed a crash on iOS when navigating rapidly between screens.
- **Other:** Deprecated `oldMethod()` in favor of `newMethod()`.
```

### Breaking Changes

If breaking changes exist, list them first with warning prefix:

```markdown
- **Breaking:** Minimum React Native version increased to 0.70.0.
- **Breaking:** `init()` now requires `invocationEvents` parameter.
```

## Step 5: Present and Refine

Show the generated notes and ask:

1. Adjust any wording?
2. Add or remove any items?
3. Save to a file?

## Step 6: Save Output (Optional)

If requested:

```bash
cat > rn-sdk-v{version}-release-notes.md << 'EOF'
<content>

---
*Generated from: {releaseNotesUrl}*
*Version: {version}*
*Generated on: {current_date}*
EOF
```

## Quality Checklist

- [ ] No internal ticket IDs
- [ ] No developer names
- [ ] No internal tool mentions
- [ ] No technical jargon SDK users wouldn't understand
- [ ] All items are user-facing
- [ ] Language is professional and clear
- [ ] Each bullet is concise (1-2 lines max)
- [ ] Version number is correct
- [ ] Items are properly prefixed with categories
- [ ] Empty categories are omitted
- [ ] Platform-specific fixes mention the platform
