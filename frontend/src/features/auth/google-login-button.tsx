export function GoogleLoginButton() {
    return (
        <div className="flex justify-center">
            <button
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                type="button"
                onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
                    const returnOrigin = encodeURIComponent(window.location.origin);
                    window.location.href = `${apiUrl}/auth/google?returnOrigin=${returnOrigin}`;
                }}
            >
                Login with Google
            </button>
        </div>
    );
}
