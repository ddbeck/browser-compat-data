#!/usr/bin/env fish

# A script to find and count BCD feature keys faster by reducing the
# frequency of running the slow `npm run traverse` command.
#
# Prereqs: fish, jq, ripgrep
#
# Install: Save this to a file in an `mdn/browser-compat-data` git
# working directory.
#
# Usage: Run this script with some string (possibly regex-ish) as an
# argument.
#
# Examples: ./find-features.fish 'webtransport'
#           ./find-features.fish 'css\.properties\.'
#           ./find-features.fish 'idle'

set -l TRAVERSAL_FILE (path normalize (status dirname)/.traversal.json)
set headref (git rev-parse HEAD)
set regenerate 0

if not test -e $TRAVERSAL_FILE
    # the echo \0 is to emit something when traversal file is empty
    or test (jq --raw-output --exit-status '.commit' $TRAVERSAL_FILE || echo \0) != $headref
    set regenerate 1
end

if not test $regenerate -eq 0
    echo Regenerating traversal file: (realpath --relative-to=$PWD $TRAVERSAL_FILE) >&2
    npm run --silent traverse | jq --raw-input --null-input --arg commit $headref '{ "commit": $commit, "lines": [inputs] }' >$TRAVERSAL_FILE
end

jq --raw-output '.lines[]' $TRAVERSAL_FILE | rg --smart-case '^.*('$argv').*' | tee (tty) | wc -l
