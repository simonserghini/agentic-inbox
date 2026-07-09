// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Loader } from "@cloudflare/kumo/components/loader";
import { useParams } from "react-router";
import { useMailbox } from "~/queries/mailboxes";
import SettingsUnified from "~/components/SettingsUnified";

export default function SettingsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const { data: mailbox } = useMailbox(mailboxId);

	if (!mailbox) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-3xl px-4 py-4 md:px-8 md:py-6 h-full overflow-y-auto">
			<h1 className="text-2xl font-semibold text-kumo-default mb-8">Settings</h1>
			<SettingsUnified />
		</div>
	);
}
