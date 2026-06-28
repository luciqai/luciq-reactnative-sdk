#!/bin/bash

# Syncs the latest CHANGELOG.md release section into the public Luciq Docs repo
# (luciqai/luciq-docs) as a GitBook "update" block in changelog/react-native-sdk.md.
#
# The React Native SDK publishes to npm (via Escape) rather than mirroring a
# public code repo, so the docs changelog is the one public surface that needs
# the release notes. The docs changelog uses a DIFFERENT, GitBook format, so
# this script TRANSFORMS the top release section and PREPENDS it - it never
# overwrites the file, preserving the hand-curated history.
#
# Transformations applied (private CHANGELOG.md -> docs react-native-sdk.md):
#   - `## [X.Y.Z](url) (Mon D, YYYY)` -> `{% update date="YYYY-MM-DD" %}` + `## vX.Y.Z`
#   - `### Section`                   -> `#### Section`
#   - `- bullet`                      -> `* bullet`
#   - `---` separators                -> removed
# NOTE: inline-code backticking and link curation are editorial and are left
#       to the PR review step (this script opens a PR, it does not auto-merge).
#
# Required env:
#   GH_TOKEN   GitHub App installation token with write access to luciqai/luciq-docs
# Optional env:
#   DRY_RUN              "true" => transform + print block & diff, no push/PR (default: false)
#   DOCS_PR_REVIEWER     GitHub username to request review from + assign on the PR
#                        (typically the release owner). Empty => none.
# On success (real run), exports DOCS_PR_URL to $BASH_ENV and writes ./DOCS_PR_URL
# so later CI steps (e.g. the Slack notification) can link to the created PR.

set -e

GH_TOKEN="${GH_TOKEN:?Error: GH_TOKEN environment variable is required}"

# ----- Configuration --------------------------------------------------------
PUBLIC_REPO="luciqai/luciq-docs"
DOCS_FILE="changelog/react-native-sdk.md"   # path inside the docs repo
BASE_BRANCH="main"                            # docs repo default branch (NOT master)
PR_BRANCH_PREFIX="update-react-native-docs-changelog-v"
TEMP_DIR="temp_public_docs_repo"
DRY_RUN="${DRY_RUN:-false}"
# Single GitHub username to request review from + assign on the docs PR
# (intended to be the release owner). Empty => no reviewer/assignee.
DOCS_PR_REVIEWER="${DOCS_PR_REVIEWER:-}"
SOURCE_CHANGELOG="CHANGELOG.md"
ORIG_DIR="$(pwd)"

# ----- Helpers --------------------------------------------------------------

# Convert a prose date ("April 8, 2026") to ISO (2026-04-08).
# Tries GNU date, then BSD/macOS date, then falls back to today (the CI run date).
to_iso_date() {
    local raw="$1"
    if [ -z "$raw" ]; then date +%Y-%m-%d; return; fi
    if date -d "$raw" +%Y-%m-%d 2>/dev/null; then return; fi
    if date -j -f "%B %d, %Y" "$raw" +%Y-%m-%d 2>/dev/null; then return; fi
    echo "WARNING: could not parse date '$raw'; falling back to today" >&2
    date +%Y-%m-%d
}

# Strip leading/trailing blank lines from stdin.
trim_blank_lines() {
    awk '{ l[NR]=$0 }
         END {
             for (i=1;i<=NR;i++) if (l[i] ~ /[^[:space:]]/) { f=i; break }
             for (i=NR;i>=1;i--) if (l[i] ~ /[^[:space:]]/) { t=i; break }
             for (i=f;i<=t;i++) print l[i]
         }'
}

# ----- Extract latest release from CHANGELOG.md -----------------------------
# Headers look like: "## [19.4.0](https://.../compare/...) (April 8, 2026)"
# (the trailing date parenthetical is optional on the newest entries).
HEADER_LINE=$(grep -E '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' "$SOURCE_CHANGELOG" | head -1)
if [ -z "$HEADER_LINE" ]; then
    echo "Error: no '## [X.Y.Z]' version header found in $SOURCE_CHANGELOG"
    exit 1
fi

SDK_VERSION=$(echo "$HEADER_LINE" | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/')

# Pull the date out of a trailing month-name parenthetical, if present.
# This must NOT match the "(https://...)" link parenthetical, so it only
# matches "(Mon D, YYYY)" anchored at end of line.
RAW_DATE=$(echo "$HEADER_LINE" | sed -nE 's/.*\(([A-Z][a-z]+ [0-9]{1,2}, [0-9]{4})\)[[:space:]]*$/\1/p')
ISO_DATE=$(to_iso_date "$RAW_DATE")

echo "Latest release: v$SDK_VERSION  (date: ${RAW_DATE:-<none>} -> $ISO_DATE)"

# Body = everything strictly between the first and second version headers,
# with separators removed and markdown converted to the GitBook flavor.
BODY=$(awk '
        /^## \[[0-9]+\.[0-9]+\.[0-9]+\]/ { c++; if (c==1) next; if (c>=2) exit }
        c==1 { print }
    ' "$SOURCE_CHANGELOG" \
    | sed -E '/^---[[:space:]]*$/d' \
    | sed -E 's/^### /#### /' \
    | sed -E 's/^- /* /' \
    | sed -E 's/^([[:space:]]+)- /\1* /' \
    | trim_blank_lines)

if [ -z "$BODY" ]; then
    echo "Error: extracted release body for v$SDK_VERSION is empty"
    exit 1
fi

# ----- Build the GitBook update block ---------------------------------------
BLOCK_FILE=$(mktemp)
trap 'rm -f "$BLOCK_FILE"' EXIT
{
    echo "{% update date=\"$ISO_DATE\" %}"
    echo "## v$SDK_VERSION"
    echo ""
    printf '%s\n' "$BODY"
    echo "{% endupdate %}"
    echo ""   # blank line separating this block from the existing first block
} > "$BLOCK_FILE"

# ----- Clone the docs repo --------------------------------------------------
rm -rf "$TEMP_DIR"
echo "Cloning $PUBLIC_REPO ($BASE_BRANCH)..."
git clone --branch "$BASE_BRANCH" \
    "https://x-access-token:${GH_TOKEN}@github.com/${PUBLIC_REPO}.git" "$TEMP_DIR"

DOCS_PATH="$TEMP_DIR/$DOCS_FILE"
if [ ! -f "$DOCS_PATH" ]; then
    echo "Error: $DOCS_FILE not found in $PUBLIC_REPO"
    exit 1
fi

# ----- Idempotency: skip if this version is already present -----------------
if grep -qx "## v$SDK_VERSION" "$DOCS_PATH"; then
    echo "v$SDK_VERSION is already present in $DOCS_FILE. Nothing to do."
    exit 0
fi

# ----- Insert the new block right after the {% updates %} container tag ------
# Require exactly one container tag: sed's `r` appends after every match, so
# more than one tag would insert the block multiple times.
UPDATES_TAGS=$(grep -c '{% updates' "$DOCS_PATH" || true)
if [ "$UPDATES_TAGS" -ne 1 ]; then
    echo "Error: expected exactly one '{% updates' container tag in $DOCS_FILE, found $UPDATES_TAGS"
    exit 1
fi
sed "/{% updates/r $BLOCK_FILE" "$DOCS_PATH" > "$DOCS_PATH.tmp"
mv "$DOCS_PATH.tmp" "$DOCS_PATH"

# ----- Dry run: show what would change, then stop ---------------------------
if [ "$DRY_RUN" = "true" ]; then
    echo "================ NEW GITBOOK BLOCK ================"
    cat "$BLOCK_FILE"
    echo "================ RESULTING DIFF ==================="
    git -C "$TEMP_DIR" --no-pager diff -- "$DOCS_FILE" | head -120
    echo "=================================================="
    echo "DRY_RUN=true -> not committing, pushing, or opening a PR."
    rm -rf "$TEMP_DIR"
    exit 0
fi

# ----- Commit, push, open PR ------------------------------------------------
cd "$TEMP_DIR"
git config user.name "${GITHUB_ACTOR:-luciq-bot}"
git config user.email "${GITHUB_ACTOR:-luciq-bot}@users.noreply.github.com"

PR_BRANCH_NAME="${PR_BRANCH_PREFIX}${SDK_VERSION}"

# If a PR branch for this version already exists on the remote, an open PR is
# pending merge - don't clobber it (avoids a non-fast-forward push on re-runs).
if git ls-remote --exit-code --heads origin "$PR_BRANCH_NAME" >/dev/null 2>&1; then
    echo "Remote branch '$PR_BRANCH_NAME' already exists (a docs PR for v$SDK_VERSION is open). Nothing to do."
    cd ..; rm -rf "$TEMP_DIR"; exit 0
fi

git checkout -b "$PR_BRANCH_NAME"
git add "$DOCS_FILE"

if git diff --quiet --cached; then
    echo "No changes detected after transform. Skipping commit."
    cd ..; rm -rf "$TEMP_DIR"; exit 0
fi

git commit -m "Update React Native docs changelog for v$SDK_VERSION"
echo "Pushing branch: $PR_BRANCH_NAME"
git push origin "$PR_BRANCH_NAME"

PR_TITLE="Update React Native docs changelog for v$SDK_VERSION"
PR_DESCRIPTION="## Description of the change
Adds the v$SDK_VERSION release block to \`$DOCS_FILE\`, converted from the React Native SDK \`CHANGELOG.md\` into the GitBook changelog format.

### What's added
$BODY

## Checklists
### Code review
- [ ] This pull request has a descriptive title and information useful to a reviewer.
- [ ] Inline code/backticks and links look correct for the docs site."

PR_RESPONSE=$(curl -s -X POST \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Authorization: token $GH_TOKEN" \
    "https://api.github.com/repos/$PUBLIC_REPO/pulls" \
    -d "$(jq -n \
        --arg title "$PR_TITLE" \
        --arg body "$PR_DESCRIPTION" \
        --arg head "$PR_BRANCH_NAME" \
        --arg base "$BASE_BRANCH" \
        '{title: $title, body: $body, head: $head, base: $base}')")

PR_NUMBER=$(echo "$PR_RESPONSE" | jq -r '.number // empty')
if [ -n "$PR_NUMBER" ]; then
    PR_URL="https://github.com/$PUBLIC_REPO/pull/$PR_NUMBER"
    echo "Pull request created: $PR_URL"

    # Make the release owner the reviewer AND assignee so they review + merge it.
    if [ -n "$DOCS_PR_REVIEWER" ]; then
        echo "Requesting review from + assigning: $DOCS_PR_REVIEWER"
        curl -s -X POST \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Authorization: token $GH_TOKEN" \
            "https://api.github.com/repos/$PUBLIC_REPO/pulls/$PR_NUMBER/requested_reviewers" \
            -d "$(jq -n --arg u "$DOCS_PR_REVIEWER" '{reviewers:[$u]}')" >/dev/null || \
            echo "WARNING: could not request review from $DOCS_PR_REVIEWER (non-fatal)"
        curl -s -X POST \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Authorization: token $GH_TOKEN" \
            "https://api.github.com/repos/$PUBLIC_REPO/issues/$PR_NUMBER/assignees" \
            -d "$(jq -n --arg u "$DOCS_PR_REVIEWER" '{assignees:[$u]}')" >/dev/null || \
            echo "WARNING: could not assign $DOCS_PR_REVIEWER (non-fatal)"
    else
        echo "No DOCS_PR_REVIEWER provided; skipping reviewer/assignee."
    fi

    # Expose the PR URL to later CI steps (e.g. the Slack release notification).
    if [ -n "${BASH_ENV:-}" ]; then
        echo "export DOCS_PR_URL='$PR_URL'" >> "$BASH_ENV"
    fi
    printf '%s' "$PR_URL" > "$ORIG_DIR/DOCS_PR_URL"
else
    echo "Error creating pull request"
    echo "Response: $PR_RESPONSE"
    cd ..; rm -rf "$TEMP_DIR"; exit 1
fi

cd ..
rm -rf "$TEMP_DIR"
echo "Done."
