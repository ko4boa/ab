import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(req: NextRequest) {
    const basicAuth = req.headers.get('authorization');

    // ここで設定したユーザー名とパスワードでログインします
    // 本番環境（Vercel）では環境変数を使用し、ローカルではデフォルト値を使用します
    const user = process.env.BASIC_AUTH_USER || 'admin';
    const pwd = process.env.BASIC_AUTH_PASSWORD || 'password123';

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [providedUser, providedPwd] = atob(authValue).split(':');

        if (providedUser === user && providedPwd === pwd) {
            return NextResponse.next();
        }
    }

    return new NextResponse('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': `Basic realm="Secure Area"`,
        },
    });
}

export const config = {
    matcher: [
        /*
         * 特定のファイル（画像やシステムファイルなど）を除外してすべてのページにパスワードをかける設定です
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
