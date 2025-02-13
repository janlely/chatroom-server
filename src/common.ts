import { sha256 } from 'js-sha256'
import speakeasy from 'speakeasy';
export function authenticate(cookies: {[key: string]: any}): {username: string, platform: string}| undefined{
    if (!cookies.hackchat) {
        return undefined
    }
    const theCookie =  cookies.hackchat
    const cookieDataStr = Buffer.from(theCookie.data, 'hex').toString()
    const signed = sha256(cookieDataStr);
    if (signed !== theCookie.sign) {
        console.log("签名验证失败")
        return undefined
    }
    const cookieData = JSON.parse(cookieDataStr)
    if (!user_session.has(cookieData.username) || user_session.get(cookieData.username)?.token !== cookieData.token) {
        console.log("token验证失败: ", cookieData.token)
        return undefined
    }
    return {username: cookieData.username, platform: cookieData.platform}
}
export function generateRandomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}


export function optVerify(token: string, secret: any): any {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token
    });
}