export const get = [checkAuth, getQrCode];

const { SECRET_PASSWORD } = process.env;

async function checkAuth({ session, headers }) {
	const headerAuthorized =
		SECRET_PASSWORD && headers["x-cascadiajs-pass"] === SECRET_PASSWORD;
	const authorized = headerAuthorized || !!(session && session.authorized);
	if (!authorized) return { location: "/admin/login" };
}

export async function getQrCode({ path }) {
	return {
		json: {
			path,
			sharing: {
				sharingTitle: "CascadiaJS QR Code Generator",
				sharingDescription: "Generate CascadiaJS-branded QR codes.",
				sharingImage: "/_public/images/2026/social/social-sharing-general.png",
			},
		},
	};
}
