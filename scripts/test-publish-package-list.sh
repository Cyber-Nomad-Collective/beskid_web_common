#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow="${root}/.github/workflows/publish.yml"

if rg -q 'packages/(spec-core|spec-cli)' "${workflow}"; then
	printf 'Publish workflow still refers to retired package directories.\n' >&2
	exit 1
fi

for package in \
	packages/trudoc \
	packages/beskid-ui \
	packages/beskid-ui-react \
	packages/beskid-auth-client \
	packages/beskid-server-observability; do
	if [[ "$(rg -F -c "${package}" "${workflow}")" -lt 2 ]]; then
		printf 'Publish workflow must version and publish %s.\n' "${package}" >&2
		exit 1
	fi
done
